import React from 'react';
import {
    Tag,
    Users,
    DollarSign,
    Instagram
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';

const InfluencerDashboard: React.FC = () => {
    const { userProfile, signOut } = useAuth();

    // Influencer Code is basically Referral Code but maybe gives Discount?
    const voucherCode = userProfile?.referralCode || "INFLUENCER101";

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
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-rose-500 p-2 rounded-lg text-white">
                        <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            {userProfile?.role === 'brand_ambassador' ? 'Brand Ambassador' : 'Influencer'}
                        </h1>
                        <p className="text-slate-500 text-xs">
                            {userProfile?.role === 'brand_ambassador' ? 'Official Partner' : 'Content Creator Hub'}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" onClick={handleLogout} className="text-slate-600">Logout</Button>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Hero */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back, {userProfile?.displayName}! ✨</h1>
                    <p className="text-slate-600 max-w-lg mx-auto">
                        Track your impact, manage your exclusive vouchers, and see how many jamaah you've inspired.
                    </p>
                </div>

                {/* Voucher Card */}
                <Card className="bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0 shadow-xl mb-12">
                    <CardContent className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Your Exclusive Code</h2>
                            <p className="text-rose-100 opacity-90">Share this code for special discounts!</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-8 py-4 rounded-xl border border-white/30">
                            <span className="text-3xl font-mono font-bold tracking-widest">{voucherCode}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Tag className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800">42</h3>
                            <p className="text-sm text-slate-500">Vouchers Redeemed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800">1,205</h3>
                            <p className="text-sm text-slate-500">Reach (Views)</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800">Rp 4.2M</h3>
                            <p className="text-sm text-slate-500">Earnings</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <FloatingAnnouncementWidget userRole="influencer" />
        </div>
    );
};

export default InfluencerDashboard;
