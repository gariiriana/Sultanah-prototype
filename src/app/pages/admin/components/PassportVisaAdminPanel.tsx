import React, { useState, useEffect, useRef } from 'react';
import { FileText, Save, CheckCircle, Clock, Upload, ImageIcon, X, Eye } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { db, storage } from '../../../../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

interface PassportVisaAdminPanelProps {
    userId: string;
    userName: string;
}

const PassportVisaAdminPanel: React.FC<PassportVisaAdminPanelProps> = ({ userId, userName }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [passport, setPassport] = useState({
        passportNumber: '',
        passportName: '',
        passportExpiry: '',
        passportIssuedDate: '',
        nationality: 'Indonesia',
        passportPhotoUrl: '',
    });
    const [visa, setVisa] = useState({
        visaNumber: '',
        visaExpiry: '',
        visaIssuedDate: '',
        visaType: 'Umroh',
        visaPhotoUrl: '',
    });
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Upload state
    const [uploadingPassport, setUploadingPassport] = useState(false);
    const [uploadingVisa, setUploadingVisa] = useState(false);
    const [passportProgress, setPassportProgress] = useState(0);
    const [visaProgress, setVisaProgress] = useState(0);
    const passportFileRef = useRef<HTMLInputElement>(null);
    const visaFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchExistingData();
    }, [userId]);

    const fetchExistingData = async () => {
        setLoading(true);
        try {
            const userRef = doc(db, 'users', userId);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                const data = snap.data();
                if (data.passportData) {
                    setPassport({
                        passportNumber: data.passportData.passportNumber || '',
                        passportName: data.passportData.passportName || '',
                        passportExpiry: data.passportData.passportExpiry || '',
                        passportIssuedDate: data.passportData.passportIssuedDate || '',
                        nationality: data.passportData.nationality || 'Indonesia',
                        passportPhotoUrl: data.passportData.passportPhotoUrl || '',
                    });
                }
                if (data.visaData) {
                    setVisa({
                        visaNumber: data.visaData.visaNumber || '',
                        visaExpiry: data.visaData.visaExpiry || '',
                        visaIssuedDate: data.visaData.visaIssuedDate || '',
                        visaType: data.visaData.visaType || 'Umroh',
                        visaPhotoUrl: data.visaData.visaPhotoUrl || '',
                    });
                    setLastUpdated(data.visaData.inputtedAt || data.passportData?.inputtedAt || null);
                }
            }
        } catch (err) {
            console.error('Error fetching passport/visa data:', err);
        } finally {
            setLoading(false);
        }
    };

    const uploadPhoto = async (
        file: File,
        path: string,
        onProgress: (p: number) => void,
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            const storageRef = ref(storage, path);
            const task = uploadBytesResumable(storageRef, file);
            task.on(
                'state_changed',
                snap => onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
                reject,
                async () => resolve(await getDownloadURL(task.snapshot.ref)),
            );
        });
    };

    const handlePassportPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maksimal 5MB'); return; }
        setUploadingPassport(true);
        try {
            const url = await uploadPhoto(file, `documents/${userId}/passport_${Date.now()}`, setPassportProgress);
            setPassport(p => ({ ...p, passportPhotoUrl: url }));
            // Auto-save to Firestore
            await updateDoc(doc(db, 'users', userId), { 'passportData.passportPhotoUrl': url });
            toast.success('Foto paspor berhasil diupload!');
        } catch {
            toast.error('Gagal upload foto paspor');
        } finally {
            setUploadingPassport(false);
            setPassportProgress(0);
            if (passportFileRef.current) passportFileRef.current.value = '';
        }
    };

    const handleVisaPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maksimal 5MB'); return; }
        setUploadingVisa(true);
        try {
            const url = await uploadPhoto(file, `documents/${userId}/visa_${Date.now()}`, setVisaProgress);
            setVisa(v => ({ ...v, visaPhotoUrl: url }));
            await updateDoc(doc(db, 'users', userId), { 'visaData.visaPhotoUrl': url });
            toast.success('Foto visa berhasil diupload!');
        } catch {
            toast.error('Gagal upload foto visa');
        } finally {
            setUploadingVisa(false);
            setVisaProgress(0);
            if (visaFileRef.current) visaFileRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!passport.passportNumber && !visa.visaNumber) {
            toast.error('Isi minimal nomor paspor atau nomor visa');
            return;
        }
        setSaving(true);
        try {
            const now = new Date().toISOString();
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                passportData: { ...passport, inputtedByAdmin: 'Admin', inputtedAt: now },
                visaData: { ...visa, inputtedByAdmin: 'Admin', inputtedAt: now },
                updatedAt: now,
            });
            setLastUpdated(now);
            toast.success(`Data paspor & visa untuk ${userName} berhasil disimpan!`);
        } catch (err) {
            console.error('Error saving passport/visa:', err);
            toast.error('Gagal menyimpan data');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Input Paspor & Visa</h3>
                    <p className="text-sm text-gray-500">Untuk: {userName}</p>
                </div>
                {lastUpdated && (
                    <div className="ml-auto flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        <span>Sudah diinput</span>
                    </div>
                )}
            </div>

            {/* ===== PASSPORT SECTION ===== */}
            <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Data Paspor
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Nomor Paspor</Label>
                        <Input value={passport.passportNumber} onChange={e => setPassport(p => ({ ...p, passportNumber: e.target.value }))} placeholder="A1234567" className="bg-white text-sm h-9" />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Nama di Paspor</Label>
                        <Input value={passport.passportName} onChange={e => setPassport(p => ({ ...p, passportName: e.target.value }))} placeholder="Nama sesuai paspor" className="bg-white text-sm h-9" />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Tanggal Terbit</Label>
                        <Input type="date" value={passport.passportIssuedDate} onChange={e => setPassport(p => ({ ...p, passportIssuedDate: e.target.value }))} className="bg-white text-sm h-9" />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Tanggal Kedaluwarsa</Label>
                        <Input type="date" value={passport.passportExpiry} onChange={e => setPassport(p => ({ ...p, passportExpiry: e.target.value }))} className="bg-white text-sm h-9" />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Kewarganegaraan</Label>
                        <Input value={passport.nationality} onChange={e => setPassport(p => ({ ...p, nationality: e.target.value }))} placeholder="Indonesia" className="bg-white text-sm h-9" />
                    </div>
                </div>

                {/* Foto Paspor */}
                <div>
                    <Label className="text-xs text-gray-600 mb-2 block font-semibold">📷 Foto Paspor</Label>
                    {passport.passportPhotoUrl ? (
                        <div className="relative group">
                            <img src={passport.passportPhotoUrl} alt="Foto Paspor" className="w-full max-h-40 object-cover rounded-lg border border-blue-200" />
                            <div className="absolute inset-0 rounded-lg bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a href={passport.passportPhotoUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
                                    <Eye className="w-3.5 h-3.5" /> Lihat
                                </a>
                                <button onClick={() => passportFileRef.current?.click()}
                                    className="flex items-center gap-1 bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all">
                                    <Upload className="w-3.5 h-3.5" /> Ganti
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => passportFileRef.current?.click()}
                            disabled={uploadingPassport}
                            className="w-full border-2 border-dashed border-blue-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-blue-100/40 transition-all cursor-pointer disabled:opacity-60"
                        >
                            {uploadingPassport ? (
                                <>
                                    <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs text-blue-600 font-semibold">Mengupload... {passportProgress}%</p>
                                    <div className="w-full bg-blue-100 rounded-full h-1.5 mt-1">
                                        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${passportProgress}%` }} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-8 h-8 text-blue-400" />
                                    <p className="text-xs text-blue-600 font-semibold">Klik untuk upload foto paspor</p>
                                    <p className="text-[10px] text-blue-400">JPG, PNG, PDF · Maks 5MB</p>
                                </>
                            )}
                        </button>
                    )}
                    <input ref={passportFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handlePassportPhoto} />
                </div>
            </div>

            {/* ===== VISA SECTION ===== */}
            <div className="bg-amber-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Data Visa Umroh
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Nomor Visa</Label>
                        <Input value={visa.visaNumber} onChange={e => setVisa(v => ({ ...v, visaNumber: e.target.value }))} placeholder="Nomor visa umroh" className="bg-white text-sm h-9" />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Jenis Visa</Label>
                        <Input value={visa.visaType} onChange={e => setVisa(v => ({ ...v, visaType: e.target.value }))} placeholder="Umroh" className="bg-white text-sm h-9" />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Tanggal Terbit</Label>
                        <Input type="date" value={visa.visaIssuedDate} onChange={e => setVisa(v => ({ ...v, visaIssuedDate: e.target.value }))} className="bg-white text-sm h-9" />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Tanggal Kedaluwarsa</Label>
                        <Input type="date" value={visa.visaExpiry} onChange={e => setVisa(v => ({ ...v, visaExpiry: e.target.value }))} className="bg-white text-sm h-9" />
                    </div>
                </div>

                {/* Foto Visa */}
                <div>
                    <Label className="text-xs text-gray-600 mb-2 block font-semibold">📷 Foto Visa</Label>
                    {visa.visaPhotoUrl ? (
                        <div className="relative group">
                            <img src={visa.visaPhotoUrl} alt="Foto Visa" className="w-full max-h-40 object-cover rounded-lg border border-amber-200" />
                            <div className="absolute inset-0 rounded-lg bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a href={visa.visaPhotoUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all">
                                    <Eye className="w-3.5 h-3.5" /> Lihat
                                </a>
                                <button onClick={() => visaFileRef.current?.click()}
                                    className="flex items-center gap-1 bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all">
                                    <Upload className="w-3.5 h-3.5" /> Ganti
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => visaFileRef.current?.click()}
                            disabled={uploadingVisa}
                            className="w-full border-2 border-dashed border-amber-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:bg-amber-100/40 transition-all cursor-pointer disabled:opacity-60"
                        >
                            {uploadingVisa ? (
                                <>
                                    <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs text-amber-600 font-semibold">Mengupload... {visaProgress}%</p>
                                    <div className="w-full bg-amber-100 rounded-full h-1.5 mt-1">
                                        <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${visaProgress}%` }} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-8 h-8 text-amber-400" />
                                    <p className="text-xs text-amber-600 font-semibold">Klik untuk upload foto visa</p>
                                    <p className="text-[10px] text-amber-400">JPG, PNG, PDF · Maks 5MB</p>
                                </>
                            )}
                        </button>
                    )}
                    <input ref={visaFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleVisaPhoto} />
                </div>
            </div>

            {lastUpdated && (
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Terakhir diperbarui: {new Date(lastUpdated).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )}

            <Button
                onClick={handleSave}
                disabled={saving || uploadingPassport || uploadingVisa}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-11"
            >
                {saving ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Menyimpan...
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4 mr-2" />
                        Simpan Data Paspor & Visa
                    </>
                )}
            </Button>
        </div>
    );
};

export default PassportVisaAdminPanel;
