import React, { useState } from 'react';
import { Button } from '../ui/button';
import {
  Package,
  Tag,
  CreditCard,
  ArrowUpCircle,
  Users,
  BookOpen,
  Newspaper,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ShoppingCart,
  Store,
  Gift,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import ConfirmDialog from '../ConfirmDialog';

// ✅ LOGO: Mosque dome with gold
const sultanahLogo = '/images/logo.png';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange }) => {
  const { signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navSections: NavSection[] = [
    {
      title: 'Manajemen',
      items: [
        { id: 'packages', label: 'Paket', icon: Package },
        { id: 'promos', label: 'Promo', icon: Tag },
        { id: 'payments', label: 'Pembayaran', icon: CreditCard },
        { id: 'itineraries', label: 'Itinerari', icon: Calendar },
      ]
    },
    {
      title: 'Permintaan',
      items: [
        { id: 'item-requests', label: 'Pesanan Marketplace', icon: ShoppingCart }, // ✅ Menu untuk approval pesanan marketplace
        { id: 'savings-approval', label: 'Approval Tabungan', icon: Wallet }, // ✅ NEW
        { id: 'upgrade-requests', label: 'Calon → Jamaah', icon: ArrowUpCircle },
      ]
    },
    {
      title: 'Konten',
      items: [
        { id: 'users', label: 'Pengguna', icon: Users },
        { id: 'education', label: 'Edukasi', icon: BookOpen },
        { id: 'articles', label: 'Artikel', icon: Newspaper },
      ]
    },
    {
      title: 'Niaga',
      items: [
        { id: 'marketplace', label: 'Marketplace', icon: Store },
        { id: 'referrals', label: 'Referral Program', icon: Gift },
        { id: 'commission-withdrawals', label: 'Pencairan Komisi', icon: Wallet },
      ]
    }
  ];

  const SidebarContent = () => (
    <>
      {/* Logo & Brand */}
      <div className={`flex items-center gap-3 px-4 py-5 ${isCollapsed ? 'justify-center px-3' : ''}`}>
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden border border-gray-200">
          <img src={sultanahLogo} alt="Sultanah Travel" className="w-full h-full object-contain rounded-md" />
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">
              Admin Panel
            </h2>
            <p className="text-xs text-gray-500 truncate">Sultanah Travel</p>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
            {!isCollapsed && (
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </span>
              </div>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
                      ${isCollapsed ? 'justify-center' : ''}
                      ${isActive
                        ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium shadow-sm border border-[#D4AF37]/20'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                      group relative
                    `}
                  >
                    {isActive && !isCollapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-[#D4AF37] to-[#FFD700] rounded-r-full" />
                    )}
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-[#D4AF37]' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                    {!isCollapsed && (
                      <span className="text-sm truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className={`p-3 border-t border-gray-200 ${isCollapsed ? 'px-2' : ''}`}>
        <Button
          onClick={() => setShowLogoutConfirm(true)}
          className={`w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md transition-all ${isCollapsed ? 'px-2' : ''}`}
        >
          <LogOut className={`w-4 h-4 ${isCollapsed ? '' : 'mr-2'}`} strokeWidth={2} />
          {!isCollapsed && 'Keluar'}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white shadow-lg flex items-center justify-center border border-gray-200"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={`
          hidden lg:flex flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
          h-screen bg-white border-r border-gray-200/80
          fixed left-0 top-0 z-30
          transition-all duration-300
        `}
      >
        <SidebarContent />

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-gray-600" strokeWidth={2.5} />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-gray-600" strokeWidth={2.5} />
          )}
        </button>
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={`
          lg:hidden flex flex-col
          w-64 h-screen bg-white border-r border-gray-200/80
          fixed left-0 top-0 z-50
          transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={signOut}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari akun Anda?"
        confirmText="Keluar"
        cancelText="Batal"
      />
    </>
  );
};

export default AdminSidebar;