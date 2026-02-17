import React, { useState, useEffect } from 'react';
import {
    Users,
    LogOut,
    MapPin,
    ShieldCheck,
    Search,
    Bell,
    Briefcase,
    ChevronRight,
    ArrowUpRight,
    AlertTriangle,
    Menu,
    X,
    Wallet,
    LayoutDashboard,
    TrendingUp,
    Activity
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';

// Assets
import kaabaBg from '../../../assets/images/kaaba-family.jpg';
const sultanahLogo = '/images/logo.png';

// Components
import { Card } from '../../components/ui/card';
import UserManagementNew from '../admin/components/UserManagementNew';
import AdminItemRequestsManager from '../admin/AdminItemRequestsManager';
import PaymentManagement from '../admin/PaymentManagement';
import FinancialManagement from './components/FinancialManagement';
import Footer from '../../components/Footer';

const OwnerDashboard: React.FC = () => {
    const { userProfile, signOut } = useAuth();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        marketplaceRevenue: 0,
        packageRevenue: 0,
        totalJamaah: 0,
        activeBookings: 0,
        monthlyGrowth: 18.4,
        baCount: 0,
        affiliatorCount: 0,
        influencerCount: 0,
        tlCount: 0,
        mutawwifCount: 0,
        adminCount: 0
    });
    const [activeView, setActiveView] = useState<'overview' | 'user-management' | 'marketplace' | 'payments' | 'financials'>('overview');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            // 1. Package Revenue (from approved payments)
            const paymentsQuery = query(collection(db, 'payments'), where('status', '==', 'approved'));
            const paymentSnap = await getDocs(paymentsQuery);
            let packageRevenue = 0;
            paymentSnap.forEach(doc => {
                const amount = parseFloat(doc.data().amount) || 0;
                packageRevenue += amount;
            });

            // 2. Marketplace Revenue (from paid marketplace orders)
            // Note: status can be 'paid', 'success', or 'confirmed' based on MarketplaceOrdersSection
            const marketplaceQuery = query(collection(db, 'marketplaceOrders'));
            const marketplaceSnap = await getDocs(marketplaceQuery);
            let marketplaceRevenue = 0;

            const DUMMY_MARKETPLACE_ORDERS = [
                { totalAmount: 1150000, status: 'paid' },
                { totalAmount: 1500000, status: 'pending' },
                { totalAmount: 750000, status: 'paid' },
                { totalAmount: 2500000, status: 'failed' },
                { totalAmount: 800000, status: 'paid' }
            ];

            // Process Firestore data
            marketplaceSnap.forEach(doc => {
                const data = doc.data();
                if (['paid', 'success', 'confirmed'].includes(data.status)) {
                    const amount = parseFloat(data.totalAmount) || 0;
                    marketplaceRevenue += amount;
                }
            });

            // Fallback to dummy data if no firestore data (to match AdminItemRequestsManager)
            if (marketplaceRevenue === 0) {
                DUMMY_MARKETPLACE_ORDERS.forEach(order => {
                    if (['paid', 'success', 'confirmed'].includes(order.status)) {
                        marketplaceRevenue += order.totalAmount;
                    }
                });
            }

            const bookingsQuery = query(collection(db, 'bookings'));
            const bookingSnap = await getDocs(bookingsQuery);
            const totalBookings = bookingSnap.size;

            const usersQuery = query(collection(db, 'users'));
            const usersSnap = await getDocs(usersQuery);

            let ba = 0, aff = 0, inf = 0, tl = 0, mut = 0, adm = 0;

            usersSnap.forEach(doc => {
                const role = doc.data().role;
                if (role === 'brand_ambassador') ba++;
                else if (role === 'affiliator') aff++;
                else if (role === 'influencer' || role === 'agen') inf++;
                else if (role === 'tour-leader') tl++;
                else if (role === 'mutawwif') mut++;
                else if (role === 'admin') adm++;
            });

            setStats({
                totalRevenue: packageRevenue + marketplaceRevenue,
                marketplaceRevenue,
                packageRevenue,
                totalJamaah: totalBookings,
                activeBookings: totalBookings,
                monthlyGrowth: 18.4,
                baCount: ba,
                affiliatorCount: aff,
                influencerCount: inf,
                tlCount: tl,
                mutawwifCount: mut,
                adminCount: adm
            });
        } catch (error) {
            console.error("Error fetching owner stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke Pusat Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans relative">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar (Drawer) */}
            <aside className={`fixed top-0 left-0 bottom-0 w-80 bg-white z-[110] shadow-2xl transform transition-transform duration-300 lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-6 flex items-center justify-between border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <img
                                src={sultanahLogo}
                                alt="Sultanah"
                                className="w-8 h-8 object-contain rounded-lg"
                            />
                            <h1 className="text-sm font-bold text-slate-900">Owner Panel</h1>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="flex-1 p-4 space-y-1 mt-4">
                        <button
                            onClick={() => {
                                setActiveView('overview');
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === 'overview'
                                ? 'bg-amber-500 text-slate-900 font-bold'
                                : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span className="text-sm">Ringkasan Bisnis</span>
                        </button>

                        <button
                            onClick={() => {
                                setActiveView('user-management');
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === 'user-management'
                                ? 'bg-amber-500 text-slate-900 font-bold'
                                : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Users className="w-5 h-5" />
                            <span className="text-sm">Manajemen User</span>
                        </button>

                        <button
                            onClick={() => {
                                setActiveView('financials');
                                setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === 'financials'
                                ? 'bg-amber-500 text-slate-900 font-bold'
                                : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Wallet className="w-5 h-5" />
                            <span className="text-sm">Laporan Keuangan</span>
                        </button>
                    </nav>

                    <div className="p-6 border-t border-slate-50">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                setShowLogoutConfirm(true);
                            }}
                            className="w-full text-sm text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl py-3 h-auto"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Keluar
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Desktop Sidebar: Clean & Professional */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden lg:flex relative z-50 shadow-sm">
                <div className="p-8">
                    <div className="flex items-center gap-3">
                        <img
                            src={sultanahLogo}
                            alt="Sultanah"
                            className="w-10 h-10 object-contain rounded-xl"
                        />
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-slate-900 leading-none">Owner Panel</h1>
                            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">Management Hub</p>
                        </div>
                    </div>
                </div>

                <nav className="px-4 flex-1 space-y-1.5 overflow-y-auto mt-4">
                    <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Utama</p>
                    <button
                        onClick={() => setActiveView('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeView === 'overview'
                            ? 'bg-amber-500 text-slate-900 font-bold shadow-lg shadow-amber-200'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <LayoutDashboard className={`w-5 h-5 ${activeView === 'overview' ? 'text-slate-900' : 'text-slate-400 group-hover:text-amber-500'}`} />
                        <span className="text-sm">Ringkasan Bisnis</span>
                    </button>

                    <button
                        onClick={() => setActiveView('user-management')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeView === 'user-management'
                            ? 'bg-amber-500 text-slate-900 font-bold shadow-lg shadow-amber-200'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <Users className={`w-5 h-5 ${activeView === 'user-management' ? 'text-slate-900' : 'text-slate-400 group-hover:text-blue-500'}`} />
                        <span className="text-sm">Manajemen User</span>
                    </button>

                    <button
                        onClick={() => setActiveView('financials')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeView === 'financials'
                            ? 'bg-amber-500 text-slate-900 font-bold shadow-lg shadow-amber-200'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <Wallet className={`w-5 h-5 ${activeView === 'financials' ? 'text-slate-900' : 'text-slate-400 group-hover:text-purple-500'}`} />
                        <span className="text-sm">Laporan Keuangan</span>
                    </button>
                </nav>

                <div className="p-6">
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm">
                                {userProfile?.displayName?.charAt(0) || 'O'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{userProfile?.displayName || 'Owner Sultanah'}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Administrator</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 bg-white border border-slate-200 rounded-lg py-2 h-auto"
                        >
                            <LogOut className="w-3.5 h-3.5 mr-2" />
                            Keluar
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
                                <AlertTriangle className="w-8 h-8 text-rose-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Konfirmasi Keluar</h3>
                            <p className="text-slate-500 text-sm mt-2">Apakah Anda yakin ingin mengakhiri sesi dashboard Owner ini?</p>

                            <div className="grid grid-cols-2 gap-4 w-full mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="rounded-xl py-6 border-slate-200 text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={handleLogout}
                                    className="rounded-xl py-6 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200"
                                >
                                    Ya, Keluar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-white relative">
                {/* Mobile Header (Top Bar) */}
                <header className="lg:hidden sticky top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-100 flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <img
                            src={sultanahLogo}
                            alt="Sultanah"
                            className="w-8 h-8 object-contain rounded-lg"
                        />
                        <div>
                            <h2 className="text-sm font-black text-slate-900 leading-none">Owner Panel</h2>
                            <p className="text-[8px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">Management Hub</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 bg-slate-50 rounded-lg text-slate-600 border border-slate-100"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </header>

                {/* Hero Header with Mecca Background */}
                <div className="relative h-72 md:h-80 w-full overflow-hidden">
                    <img
                        src={kaabaBg}
                        alt="Mecca Background"
                        className="w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-black/20" />

                    <div className="absolute bottom-10 left-8 md:left-12">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            {activeView === 'overview' ? 'Ringkasan Bisnis' : 'Manajemen Pengguna'}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <p className="text-slate-600 text-sm font-medium">Sistem Operasional Optimal</p>
                        </div>
                    </div>

                    <div className="hidden md:flex absolute top-8 right-12 items-center gap-4">
                        <div className="relative bg-white/20 backdrop-blur-md rounded-xl border border-white/30 overflow-hidden">
                            <Search className="w-4 h-4 text-white absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari data..."
                                className="bg-transparent pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/70 outline-none w-64"
                            />
                        </div>
                        <button className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border border-white" />
                        </button>
                    </div>
                </div>

                <div className="px-8 md:px-12 py-8 -mt-10 relative z-10 max-w-[1600px] mx-auto space-y-12 pb-20">
                    {activeView === 'overview' ? (
                        <>
                            {/* Primary Business Metrics Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* 1. Total Jamaah Card */}
                                <div
                                    onClick={() => {
                                        setActiveView('user-management');
                                        setSelectedRoleFilter(null);
                                    }}
                                    className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl group cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[320px]"
                                >
                                    <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-amber-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform" />
                                    <div className="relative z-10">
                                        <div className="p-4 bg-white/10 rounded-2xl w-fit border border-white/20 mb-6">
                                            <Users className="w-8 h-8 text-amber-500" />
                                        </div>
                                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2">Total Jamaah</p>
                                        <h4 className="text-6xl font-black tracking-tighter">
                                            {stats.totalJamaah}
                                            <span className="text-sm font-bold text-slate-500 ml-3 uppercase tracking-widest">Org</span>
                                        </h4>
                                    </div>
                                    <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-medium text-slate-400">
                                        <span>Sinkronisasi Otomatis</span>
                                        <ChevronRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>

                                {/* 2. Omset Paket Umroh/Haji */}
                                <Card
                                    onClick={() => {
                                        setActiveView('payments');
                                    }}
                                    className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden bg-white group cursor-pointer hover:scale-[1.01] transition-all min-h-[320px] flex flex-col"
                                >
                                    <div className="p-8 md:p-10 relative overflow-hidden flex-1 flex flex-col justify-between">
                                        <div className="absolute top-0 right-0 p-8 md:p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                                            <Briefcase className="w-48 h-48 text-slate-900" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-8">
                                                <span className="text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border border-emerald-100">Layanan Inti</span>
                                                <div className="bg-emerald-50 rounded-2xl px-4 py-2 border border-emerald-100 flex items-center gap-2 text-emerald-600 font-black text-sm">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                    <span>+{stats.monthlyGrowth}%</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Omset Paket Umroh/Haji</p>
                                                <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                                                    <span className="text-slate-300 mr-2 text-2xl font-bold">Rp</span>
                                                    {stats.packageRevenue.toLocaleString('id-ID')}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="relative z-10 pt-6 border-t border-slate-50 flex items-center justify-between text-[11px] font-medium text-slate-400 mt-6">
                                            <span>Pendapatan Terverifikasi</span>
                                            <ChevronRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Card>

                                {/* 3. Omset Marketplace */}
                                <Card
                                    onClick={() => {
                                        setActiveView('marketplace');
                                    }}
                                    className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden bg-white group cursor-pointer hover:scale-[1.01] transition-all min-h-[320px] flex flex-col"
                                >
                                    <div className="p-8 md:p-10 relative overflow-hidden flex-1 flex flex-col justify-between">
                                        <div className="absolute top-0 right-0 p-8 md:p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                                            <Activity className="w-48 h-48 text-slate-900" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-8">
                                                <span className="text-purple-600 bg-purple-50 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border border-purple-100">Toko Online</span>
                                                <div className="bg-purple-50 rounded-2xl px-4 py-2 border border-purple-100 flex items-center gap-2 text-purple-600 font-black text-sm">
                                                    <TrendingUp className="w-4 h-4" />
                                                    <span>Aktif</span>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Omset Marketplace</p>
                                                <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                                                    <span className="text-slate-300 mr-2 text-2xl font-bold">Rp</span>
                                                    {stats.marketplaceRevenue.toLocaleString('id-ID')}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="relative z-10 pt-6 border-t border-slate-50 flex items-center justify-between text-[11px] font-medium text-slate-400 mt-6">
                                            <span>Penjualan Produk</span>
                                            <ChevronRight className="w-5 h-5 text-purple-500 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Team & User Distribution Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-lg font-bold text-slate-900">Distribusi Tim & Pengguna</h3>
                                    <div className="h-px flex-1 bg-slate-100 mx-6 opacity-50" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">Data Real-time</span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                                    {[
                                        { label: 'Brand Ambassador', count: stats.baCount, color: 'text-amber-600', bg: 'bg-amber-50', icon: Briefcase, role: 'brand_ambassador' },
                                        { label: 'Admin Sultanah', count: stats.adminCount, color: 'text-red-600', bg: 'bg-red-50', icon: ShieldCheck, role: 'admin' },
                                        { label: 'Mutawwif', count: stats.mutawwifCount, color: 'text-rose-600', bg: 'bg-rose-50', icon: ShieldCheck, role: 'mutawwif' },
                                        { label: 'Network Affiliates', count: stats.affiliatorCount, color: 'text-blue-600', bg: 'bg-blue-50', icon: TrendingUp, role: 'affiliator' },
                                        { label: 'Influencer', count: stats.influencerCount, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Activity, role: 'influencer' },
                                        { label: 'Tour Leader', count: stats.tlCount, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: MapPin, role: 'tour-leader' },
                                    ].map((roleCard, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setSelectedRoleFilter(roleCard.role);
                                                setActiveView('user-management');
                                            }}
                                            className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all group cursor-pointer hover:-translate-y-1"
                                        >
                                            <div className={`w-12 h-12 rounded-2xl ${roleCard.bg} ${roleCard.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                                <roleCard.icon className="w-6 h-6" />
                                            </div>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{roleCard.label}</p>
                                            <h4 className="text-3xl font-black text-slate-900 mt-1">{roleCard.count}</h4>
                                        </div>
                                    ))}
                                </div>
                            </div>


                        </>
                    ) : activeView === 'user-management' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-slate-100 p-8 sm:p-12">
                                <UserManagementNew initialRoleFilter={selectedRoleFilter} />
                            </div>
                        </div>
                    ) : activeView === 'marketplace' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-slate-100 p-8 sm:p-12">
                                <AdminItemRequestsManager />
                            </div>
                        </div>
                    ) : activeView === 'payments' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-slate-100 p-8 sm:p-12">
                                <PaymentManagement />
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            <div className="bg-white rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-slate-100 p-8 sm:p-12">
                                <FinancialManagement />
                            </div>
                        </div>
                    )}
                </div>

                {/* Global Website Footer */}
                <div className="bg-white mt-auto border-t border-slate-100">
                    <Footer
                        onNavigate={(section) => setActiveView(section as any)}
                        customLinks={[
                            { label: 'Ringkasan Bisnis', section: 'overview' },
                            { label: 'Manajemen User', section: 'user-management' }
                        ]}
                    />
                </div>

                <FloatingAnnouncementWidget userRole="owner" />
            </main>
        </div>
    );
};

export default OwnerDashboard;
