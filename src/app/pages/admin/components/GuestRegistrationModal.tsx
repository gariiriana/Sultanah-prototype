import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Eye, EyeOff, Copy, Check, X, AlertCircle, Package, Users, Receipt } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { db } from '../../../../config/firebase';
import { doc, setDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuth } from '../../../../contexts/AuthContext';

interface GuestRegistrationModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface UmrahPackage {
    id: string;
    name: string;
    price: number;
    departureDate?: string;
    duration?: number;
}

const GuestRegistrationModal: React.FC<GuestRegistrationModalProps> = ({ open, onClose, onSuccess }) => {
    const { userProfile } = useAuth();
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        tempPassword: '',
        notes: '',
        packageId: '',
        packageName: '',
        paxCount: '1',
    });
    const [availablePackages, setAvailablePackages] = useState<UmrahPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<UmrahPackage | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [additionalJamaah, setAdditionalJamaah] = useState<{ name: string }[]>([]);
    const [createdAccount, setCreatedAccount] = useState<{ email: string; password: string; totalInvoice: number; packageName: string; paxCount: number } | null>(null);

    // Sync additionalJamaah slots with paxCount
    useEffect(() => {
        const target = (parseInt(form.paxCount, 10) || 1) - 1;
        setAdditionalJamaah(prev => {
            if (prev.length === target) return prev;
            if (prev.length < target) {
                return [...prev, ...Array(target - prev.length).fill(null).map(() => ({ name: '' }))];
            }
            return prev.slice(0, target);
        });
    }, [form.paxCount]);

    useEffect(() => {
        if (open) fetchPackages();
    }, [open]);

    const fetchPackages = async () => {
        try {
            const snap = await getDocs(collection(db, 'packages'));
            const pkgs = snap.docs.map(d => ({
                id: d.id,
                name: d.data().name || 'Paket Tanpa Nama',
                price: d.data().price || 0,
                departureDate: d.data().departureDate || '',
                duration: d.data().duration || 0,
            }));
            setAvailablePackages(pkgs);
        } catch (err) {
            console.warn('Could not load packages:', err);
        }
    };

    const paxCount = parseInt(form.paxCount, 10) || 1;
    const totalInvoice = selectedPackage ? selectedPackage.price * paxCount : 0;

    const generateTempPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let pass = 'Slt@';
        for (let i = 0; i < 6; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setForm(prev => ({ ...prev, tempPassword: pass }));
    };

    const handlePackageChange = (pkgId: string) => {
        const pkg = availablePackages.find(p => p.id === pkgId) || null;
        setSelectedPackage(pkg);
        setForm(prev => ({ ...prev, packageId: pkgId, packageName: pkg?.name || '' }));
    };

    const handleSubmit = async () => {
        if (!form.fullName.trim() || !form.email.trim() || !form.tempPassword.trim()) {
            toast.error('Nama lengkap, email, dan password wajib diisi');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) {
            toast.error('Format email tidak valid');
            return;
        }

        setLoading(true);
        try {
            // Check if email already exists
            const usersRef = collection(db, 'users');
            const emailQuery = query(usersRef, where('email', '==', form.email.toLowerCase().trim()));
            const existing = await getDocs(emailQuery);
            if (!existing.empty) {
                toast.error('Email ini sudah terdaftar di sistem');
                setLoading(false);
                return;
            }

            // Create Firebase Auth account via REST API
            const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
            const authResponse = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: form.email.toLowerCase().trim(),
                        password: form.tempPassword,
                        returnSecureToken: false,
                    }),
                }
            );

            const authData = await authResponse.json();
            if (!authResponse.ok) {
                const errMsg = authData?.error?.message || 'Gagal membuat akun Firebase';
                if (errMsg.includes('EMAIL_EXISTS')) {
                    toast.error('Email ini sudah terdaftar di Firebase Auth');
                } else if (errMsg.includes('WEAK_PASSWORD')) {
                    toast.error('Password terlalu lemah (min 6 karakter)');
                } else {
                    toast.error(`Error: ${errMsg}`);
                }
                setLoading(false);
                return;
            }

            const uid = authData.localId;

            // Create user document in Firestore
            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, {
                id: uid,
                email: form.email.toLowerCase().trim(),
                displayName: form.fullName.trim(),
                phoneNumber: form.phoneNumber.trim(),
                role: 'guest',
                createdAt: new Date().toISOString(),
                // ✅ NEW: Package & invoice info
                interestedPackageId: form.packageId || '',
                interestedPackageName: form.packageName || '',
                paxCount: paxCount,
                totalInvoice: totalInvoice,
                paymentStatus: 'belum_bayar',
                guestInfo: {
                    registeredByAdmin: 'Admin',
                    followUpNotes: form.notes.trim(),
                    paymentStatus: 'belum_bayar',
                    packageId: form.packageId || '',
                    packageName: form.packageName || '',
                    paxCount: paxCount,
                    totalInvoice: totalInvoice,
                },
            });

            // ✅ FIX: Create booking record so it appears in Jamaah Binaan
            const jamaahArray = [
                { name: form.fullName.trim(), email: form.email.toLowerCase().trim(), phone: form.phoneNumber.trim(), documentsUploaded: false },
                ...additionalJamaah.map(j => ({ name: j.name, email: '', phone: '', documentsUploaded: false }))
            ];
            await addDoc(collection(db, 'bookings'), {
                userId: uid,
                userEmail: form.email.toLowerCase().trim(),
                userName: form.fullName.trim(),
                packageId: form.packageId || '',
                packageName: form.packageName || 'Paket Belum Dipilih',
                paxCount: paxCount,
                totalAmount: totalInvoice,
                status: 'pending_payment',
                paymentStatus: 'belum_bayar',
                note: form.notes.trim(),
                jamaah: jamaahArray,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                registeredByAdmin: {
                    adminId: userProfile?.uid || 'admin',
                    adminEmail: userProfile?.email || 'admin',
                    adminName: userProfile?.displayName || 'Admin',
                    registeredAt: Timestamp.now(),
                },
                manualEntry: true,
            });

            setCreatedAccount({
                email: form.email.toLowerCase().trim(),
                password: form.tempPassword,
                totalInvoice,
                packageName: form.packageName || '-',
                paxCount,
            });
            toast.success('Akun calon jamaah berhasil dibuat!');
            onSuccess();
        } catch (error: any) {
            console.error('Error creating guest account:', error);
            toast.error('Gagal membuat akun. Cek koneksi internet.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleClose = () => {
        setForm({ fullName: '', email: '', phoneNumber: '', tempPassword: '', notes: '', packageId: '', packageName: '', paxCount: '1' });
        setSelectedPackage(null);
        setCreatedAccount(null);
        setAdditionalJamaah([]);
        setShowPassword(false);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <UserPlus className="w-6 h-6 text-emerald-600" />
                        Daftarkan Calon Jamaah
                    </DialogTitle>
                    <DialogDescription>
                        Buat akun guest untuk calon jamaah. Admin yang akan follow up pembayaran via WA.
                    </DialogDescription>
                </DialogHeader>

                {createdAccount ? (
                    // ✅ Success State - Show credentials
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Check className="w-7 h-7 text-green-600" />
                            </div>
                            <h3 className="font-bold text-green-800 text-lg mb-1">Akun Berhasil Dibuat!</h3>
                            <p className="text-green-700 text-sm">Simpan dan berikan kredensial ini ke calon jamaah.</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Email Akun</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900 flex-1 font-mono text-sm">{createdAccount.email}</p>
                                    <Button size="sm" variant="ghost" onClick={() => handleCopy(createdAccount.email)} className="h-8 w-8 p-0">
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Password Sementara</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900 flex-1 font-mono text-sm">{createdAccount.password}</p>
                                    <Button size="sm" variant="ghost" onClick={() => handleCopy(createdAccount.password)} className="h-8 w-8 p-0">
                                        <Copy className="w-4 h-4 text-gray-400" />
                                    </Button>
                                </div>
                            </div>
                            {createdAccount.totalInvoice > 0 && (
                                <div className="border-t pt-3">
                                    <p className="text-xs text-gray-500 mb-1">Paket Dipilih</p>
                                    <p className="font-semibold text-gray-900 text-sm">{createdAccount.packageName} × {createdAccount.paxCount} orang</p>
                                    <p className="text-xs text-gray-500 mb-1 mt-2">Total Invoice</p>
                                    <p className="font-black text-emerald-700 text-lg">Rp {createdAccount.totalInvoice.toLocaleString('id-ID')}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800">
                                <p className="font-semibold mb-1">Instruksi untuk Jamaah:</p>
                                <ol className="list-decimal list-inside space-y-1 text-xs">
                                    <li>Login dengan email & password di atas</li>
                                    <li>Lakukan pembayaran sesuai arahan admin via WA</li>
                                    <li>Lengkapi data diri & dokumen keberangkatan</li>
                                </ol>
                            </div>
                        </div>

                        <Button onClick={handleClose} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
                            Tutup
                        </Button>
                    </motion.div>
                ) : (
                    // ✅ Form State
                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Nama Lengkap <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={form.fullName}
                                onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                                placeholder="Nama lengkap calon jamaah"
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="email@gmail.com"
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">No. WhatsApp</Label>
                            <Input
                                value={form.phoneNumber}
                                onChange={e => setForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                placeholder="08xxxxxxxxxx"
                            />
                        </div>

                        {/* ✅ NEW: Paket Umroh */}
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <Package className="w-4 h-4 text-emerald-600" />
                                Paket Umroh yang Diminati
                            </Label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                                value={form.packageId}
                                onChange={e => handlePackageChange(e.target.value)}
                            >
                                <option value="">-- Pilih Paket (opsional) --</option>
                                {availablePackages.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>
                                        {pkg.name}{pkg.departureDate ? ` · ${pkg.departureDate}` : ''} — Rp {pkg.price.toLocaleString('id-ID')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Jumlah Orang */}
                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-emerald-600" />
                                Jumlah Orang <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                value={form.paxCount}
                                onChange={e => setForm(prev => ({ ...prev, paxCount: e.target.value }))}
                                placeholder="1"
                            />
                        </div>

                        {/* Additional Jamaah Names */}
                        {additionalJamaah.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-blue-500" />
                                    Nama Anggota Jamaah Lainnya
                                </p>
                                {additionalJamaah.map((j, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 font-bold w-6 text-right shrink-0">{i + 2}.</span>
                                        <Input
                                            value={j.name}
                                            onChange={e => {
                                                const updated = [...additionalJamaah];
                                                updated[i] = { name: e.target.value };
                                                setAdditionalJamaah(updated);
                                            }}
                                            placeholder={`Nama Jamaah ${i + 2} (sesuai KTP)`}
                                            className="flex-1"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ✅ NEW: Total Invoice (calculated) */}
                        {selectedPackage && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Receipt className="w-4 h-4 text-emerald-600" />
                                    <p className="text-sm font-semibold text-emerald-800">Total Invoice</p>
                                </div>
                                <div className="flex items-center justify-between text-xs text-emerald-700 mb-1">
                                    <span>Harga/orang</span>
                                    <span>Rp {selectedPackage.price.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-emerald-700 mb-2">
                                    <span>Jumlah orang</span>
                                    <span>× {paxCount}</span>
                                </div>
                                <div className="border-t border-emerald-200 pt-2 flex items-center justify-between">
                                    <span className="text-sm font-bold text-emerald-800">Total</span>
                                    <span className="text-xl font-black text-emerald-700">
                                        Rp {totalInvoice.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Password Sementara <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.tempPassword}
                                        onChange={e => setForm(prev => ({ ...prev, tempPassword: e.target.value }))}
                                        placeholder="Min. 6 karakter"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <Button type="button" variant="outline" onClick={generateTempPassword} className="whitespace-nowrap">
                                    Auto Generate
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Password ini akan diberikan ke calon jamaah untuk login pertama kali.</p>
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Catatan Admin (Opsional)</Label>
                            <Textarea
                                value={form.notes}
                                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Catatan internal admin: hasil follow up, dp awal, dll."
                                rows={2}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={loading}>
                                <X className="w-4 h-4 mr-1" />
                                Batal
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Membuat Akun...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4 mr-1" />
                                        Buat Akun Guest
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default GuestRegistrationModal;
