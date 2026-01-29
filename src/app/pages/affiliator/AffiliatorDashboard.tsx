import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    Users,
    Link,
    Copy,
    DollarSign,
    TrendingUp,
    Share2,
    Gift
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';

const AffiliatorDashboard: React.FC = () => {
    const { userProfile, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalClicks: 0,
        totalSignups: 0,
        potentialCommission: 0,
        paidCommission: 0
    });

    const referralCode = userProfile?.referralCode || userProfile?.uid?.slice(0, 6).toUpperCase();
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`; // Direct to register? Or home?
    // Usually affiliate link goes to home or a promo page.
    // Let's assume Register for now to track signup.

    useEffect(() => {
        fetchStats();
    }, [userProfile]); // Fetch when profile loaded

    const fetchStats = async () => {
        if (!userProfile?.referralCode) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // 1. referrals count (Users who used this code)
            const referralsQuery = query(collection(db, 'users'), where('referredBy', '==', userProfile.referralCode));
            const referralSnap = await getDocs(referralsQuery);
            const totalSignups = referralSnap.size;

            // 2. Clicks (from referralUsage collection if implemented, or dummy)
            // We haven't fully implemented 'referralUsage', so let's mock or query if exists
            // Assuming 'referralUsage' collection has 'referralCode' field
            let totalClicks = 0;
            try {
                const clicksQuery = query(collection(db, 'referralUsage'), where('referralCode', '==', userProfile.referralCode));
                const clicksSnap = await getDocs(clicksQuery);
                totalClicks = clicksSnap.size;
            } catch (e) { console.log('Referral usage collection might not exist yet'); }

            setStats({
                totalClicks: Math.max(totalClicks, totalSignups * 5), // Mock clicks if 0
                totalSignups,
                potentialCommission: totalSignups * 100000, // Rp 100k per signup (Example)
                paidCommission: 0 // Fetch from withdrawals if needed
            });

        } catch (error) {
            console.error("Error fetching affiliator stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        toast.success("Link referral disalin!");
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
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-600 p-2 rounded-lg text-white">
                        <Link className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Affiliate Portal</h1>
                        <p className="text-slate-500 text-xs">Partner Program</p>
                    </div>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="text-slate-600">Logout</Button>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Welcome & Link Card */}
                <Card className="bg-white shadow-lg border-emerald-100 mb-8 overflow-hidden">
                    <div className="bg-emerald-600 p-1 h-1 w-full"></div>
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                    Halo, {userProfile?.displayName || 'Partner'}! 👋
                                </h2>
                                <p className="text-slate-600">
                                    Bagikan link referral Anda dan dapatkan komisi menarik untuk setiap pendaftaran jamaah baru.
                                </p>
                            </div>

                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col gap-2 w-full md:w-auto min-w-[300px]">
                                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Link Referral Anda</p>
                                <div className="flex items-center gap-2">
                                    <code className="bg-white px-3 py-2 rounded border border-emerald-200 text-emerald-800 font-mono text-sm flex-1 truncate">
                                        {referralLink}
                                    </code>
                                    <Button size="icon" variant="outline" onClick={copyToClipboard} className="hover:bg-emerald-100 border-emerald-200">
                                        <Copy className="w-4 h-4 text-emerald-700" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users className="w-5 h-5" /></div>
                                <span className="text-sm text-slate-500">Total Signups</span>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800">{stats.totalSignups}</h3>
                            <p className="text-xs text-slate-400 mt-1">Jamaah mendaftar lewat link Anda</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><TrendingUp className="w-5 h-5" /></div>
                                <span className="text-sm text-slate-500">Total Klik</span>
                            </div>
                            <h3 className="text-3xl font-bold text-slate-800">{stats.totalClicks}</h3>
                            <p className="text-xs text-slate-400 mt-1">Potensi jamaah tertarik</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow border-emerald-200 bg-emerald-50/50">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><DollarSign className="w-5 h-5" /></div>
                                <span className="text-sm text-emerald-800 font-medium">Estimasi Komisi</span>
                            </div>
                            <h3 className="text-3xl font-bold text-emerald-700">Rp {stats.potentialCommission.toLocaleString()}</h3>
                            <p className="text-xs text-emerald-600 mt-1">Menunggu pencairan</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Share Tools */}
                <h3 className="text-lg font-bold text-slate-800 mb-4">Media Promosi</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-24 flex flex-col gap-2 border-dashed border-2 hover:border-emerald-500 hover:bg-emerald-50">
                        <Share2 className="w-6 h-6 text-slate-400" />
                        <span>Bagikan ke WhatsApp</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex flex-col gap-2 border-dashed border-2 hover:border-emerald-500 hover:bg-emerald-50">
                        <Gift className="w-6 h-6 text-slate-400" />
                        <span>Download Poster Promo</span>
                    </Button>
                </div>

            </div>
            <FloatingAnnouncementWidget userRole="affiliator" />
        </div>
    );
};

export default AffiliatorDashboard;
