import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    TrendingUp,
    Users,
    CreditCard,
    Calendar,
    Activity,
    DollarSign,
    PieChart,
    BarChart2
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';

// Components
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

const OwnerDashboard: React.FC = () => {
    const { userProfile, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalJamaah: 0,
        activeBookings: 0,
        monthlyGrowth: 15 // Dummy
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);

            // 1. Calculate Revenue (Total Approved Payments)
            const paymentsQuery = query(collection(db, 'payments'), where('status', '==', 'approved'));
            const paymentSnap = await getDocs(paymentsQuery);
            let revenue = 0;
            paymentSnap.forEach(doc => {
                revenue += doc.data().amount || 0;
            });

            // 2. Count Total Jamaah (Users with role 'jamaah' or from bookings)
            // For now, let's count bookings as proxy for Active Jamaah
            const bookingsQuery = query(collection(db, 'bookings'));
            const bookingSnap = await getDocs(bookingsQuery);
            const totalBookings = bookingSnap.size;

            // 3. Count Active Trips (Packages with dates in range) - Simplified: Just count all packages for now
            const packagesQuery = query(collection(db, 'packages'));
            const packageSnap = await getDocs(packagesQuery);
            const totalPackages = packageSnap.size;

            setStats({
                totalRevenue: revenue,
                totalJamaah: totalBookings, // Using bookings as proxy
                activeBookings: totalBookings,
                monthlyGrowth: 12.5
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

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Topbar */}
            <div className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-20">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Owner Dashboard</h1>
                    <p className="text-slate-500 text-sm">Overview of Sultanah's Performance</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="font-semibold text-slate-800">{userProfile?.displayName || 'Owner'}</p>
                        <p className="text-xs text-slate-500">Super Admin Access</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        Logout
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-white shadow-sm border-slate-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-emerald-100 rounded-xl">
                                    <DollarSign className="w-6 h-6 text-emerald-600" />
                                </div>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                    +{stats.monthlyGrowth}%
                                </span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">
                                Rp {stats.totalRevenue.toLocaleString('id-ID')}
                            </h3>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm border-slate-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm font-medium">Total Jamaah (Booked)</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">
                                {stats.totalJamaah}
                            </h3>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm border-slate-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-purple-100 rounded-xl">
                                    <Calendar className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm font-medium">Active Bookings</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">
                                {stats.activeBookings}
                            </h3>
                        </CardContent>
                    </Card>

                    <Card className="bg-white shadow-sm border-slate-200">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-orange-100 rounded-xl">
                                    <Activity className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm font-medium">System Health</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-1">
                                98.5%
                            </h3>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts & Content Area - Skeleton for now */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 shadow-sm">
                        <CardHeader>
                            <CardTitle>Revenue Analytics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                                <BarChart2 className="w-10 h-10 text-slate-300 mr-2" />
                                <span className="text-slate-400">Chart Visualization Placeholder</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Demographics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                                <PieChart className="w-10 h-10 text-slate-300 mr-2" />
                                <span className="text-slate-400">Pie Chart Placeholder</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <FloatingAnnouncementWidget userRole="owner" />
        </div>
    );
};

export default OwnerDashboard;
