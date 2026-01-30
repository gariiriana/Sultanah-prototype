import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    AlertCircle,
    Pill,
    Stethoscope,
    Search,
    FileText
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

interface MedicalRecord {
    id: string; // userId
    name: string;
    age: number;
    gender: 'L' | 'P';
    conditions: string[];
    medications: string[];
    allergies: string[];
    notes: string;
    bloodType?: string;
    emergencyContact: {
        name: string;
        phone: string;
        relation: string;
    };
}

const MedicalSection: React.FC = () => {
    const { userProfile } = useAuth();
    const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAttention, setFilterAttention] = useState(false); // ✅ NEW: Filter for people with medical conditions

    useEffect(() => {
        const fetchMedicalData = async () => {
            setLoading(true);
            try {
                // In a real app, we would query users assigned to this TL's trips
                // For now, we'll fetch all users with role 'current-jamaah' as a demo
                // Or better, fetch from a specific 'medical_records' collection if it existed
                // simulating data for now based on users collection

                const q = query(
                    collection(db, 'users'),
                    where('role', '==', 'current-jamaah')
                );

                const snapshot = await getDocs(q);
                const records: MedicalRecord[] = [];

                snapshot.forEach(doc => {
                    const data = doc.data();
                    // Mocking medical data if not present, or using real if added
                    // In a real scenario, this comes from the MedicalHistory subcollection/field

                    // Only add if they have some condition marked (simulated)
                    if (Math.random() > 0.3) { // 70% chance to have "health data" for demo
                        records.push({
                            id: doc.id,
                            name: data.displayName || 'Jamaah',
                            age: Math.floor(Math.random() * 40) + 40, // Random age 40-80
                            gender: Math.random() > 0.5 ? 'L' : 'P',
                            conditions: Math.random() > 0.5 ? ['Hipertensi', 'Diabetes'] : [],
                            medications: Math.random() > 0.5 ? ['Metformin', 'Amlodipine'] : [],
                            allergies: Math.random() > 0.8 ? ['Seafood', 'Debu'] : [],
                            notes: 'Butuh kursi roda saat tawaf',
                            bloodType: ['A', 'B', 'AB', 'O'][Math.floor(Math.random() * 4)],
                            emergencyContact: {
                                name: data.emergencyContact?.name || 'Keluarga',
                                phone: data.emergencyContact?.phone || '-',
                                relation: data.emergencyContact?.relationship || 'Kerabat'
                            }
                        });
                    }
                });

                setMedicalRecords(records);
            } catch (error) {
                console.error("Error fetching medical records:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMedicalData();
    }, [userProfile]);

    const filteredRecords = medicalRecords.filter(record => {
        const searchLower = searchTerm.toLowerCase().trim();

        // Instant search logic (Live Search)
        const matchesSearch = !searchLower ||
            record.name.toLowerCase().includes(searchLower) ||
            record.conditions.some(c => c.toLowerCase().includes(searchLower)) ||
            record.medications.some(m => m.toLowerCase().includes(searchLower)) ||
            record.bloodType?.toLowerCase().includes(searchLower) ||
            record.emergencyContact.name.toLowerCase().includes(searchLower);

        // Filter for "Memerlukan Perhatian" (has conditions or medications)
        const matchesAttention = !filterAttention || record.conditions.length > 0 || record.medications.length > 0;

        return matchesSearch && matchesAttention;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama jamaah, obat, atau kondisi..."
                        className="w-full pl-12 pr-4 h-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setFilterAttention(!filterAttention)}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 h-12 rounded-xl border-2 transition-all font-semibold ${filterAttention
                            ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-rose-200'
                            }`}
                    >
                        <AlertCircle className={`w-5 h-5 ${filterAttention ? 'text-white' : 'text-rose-500'}`} />
                        Memerlukan Perhatian
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-gray-500">Memuat data medis...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRecords.map((record, index) => (
                        <motion.div
                            key={record.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-rose-500 overflow-hidden">
                                <CardHeader className="bg-rose-50 pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg font-bold text-gray-800">{record.name}</CardTitle>
                                            <p className="text-sm text-gray-500">{record.age} Tahun • {record.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • Gol. {record.bloodType}</p>
                                        </div>
                                        {record.conditions.length > 0 && (
                                            <div className="bg-white p-1.5 rounded-full shadow-sm">
                                                <AlertCircle className="w-5 h-5 text-rose-500" />
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                    {/* Medical Conditions */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
                                            <Stethoscope className="w-3 h-3" /> Kondisi Medis
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {record.conditions.length > 0 ? (
                                                record.conditions.map((condition, i) => (
                                                    <Badge key={i} variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                                                        {condition}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Tidak ada riwayat khusus</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Medications */}
                                    <div>
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
                                            <Pill className="w-3 h-3" /> Obat-obatan
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {record.medications.length > 0 ? (
                                                record.medications.map((med, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">
                                                        {med}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">-</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Allergies - Only show if exist */}
                                    {record.allergies.length > 0 && (
                                        <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                                            <p className="text-xs font-bold text-orange-700 mb-1">Alergi:</p>
                                            <p className="text-sm text-orange-800">{record.allergies.join(', ')}</p>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {record.notes && (
                                        <div className="text-sm bg-gray-50 p-3 rounded-lg text-gray-600 italic">
                                            "{record.notes}"
                                        </div>
                                    )}

                                    {/* Emergency Contact */}
                                    <div className="border-t pt-3 mt-2">
                                        <p className="text-xs text-gray-500 mb-1">Kontak Darurat:</p>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-gray-700">{record.emergencyContact.name}</span>
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                                                {record.emergencyContact.phone}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {filteredRecords.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Tidak ada data medis yang cocok.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MedicalSection;
