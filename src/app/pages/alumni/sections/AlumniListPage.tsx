import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Users, MapPin, Calendar, Award } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../../config/firebase';

interface AlumniListPageProps {
  onBack: () => void;
}

interface AlumniUser {
  id: string;
  fullName: string;
  email: string;
  city?: string;
  province?: string;
  createdAt: any;
  packageName?: string;
}

const AlumniListPage: React.FC<AlumniListPageProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [alumni, setAlumni] = useState<AlumniUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredAlumni, setFilteredAlumni] = useState<AlumniUser[]>([]);

  useEffect(() => {
    fetchAlumni();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAlumni(alumni);
    } else {
      const filtered = alumni.filter(user =>
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAlumni(filtered);
    }
  }, [searchQuery, alumni]);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      // ✅ FIX: Query users dengan role 'alumni' (bukan 'alumni-jamaah')
      const q = query(
        usersRef,
        where('role', '==', 'alumni'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const alumniData: AlumniUser[] = [];
      
      querySnapshot.forEach((doc) => {
        alumniData.push({
          id: doc.id,
          ...doc.data()
        } as AlumniUser);
      });
      
      setAlumni(alumniData);
      setFilteredAlumni(alumniData);
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-[#D4AF37]/20 shadow-lg sticky top-0 z-30">
        <div className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-700 hover:text-[#D4AF37] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Kembali</span>
            </button>

            <h1 className="text-lg md:text-xl font-semibold bg-gradient-to-r from-[#D4AF37] to-[#C5A572] bg-clip-text text-transparent">
              Daftar Alumni Jamaah
            </h1>

            <div className="w-20" /> {/* Spacer for alignment */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari nama, email, atau kota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border-gray-300 focus:border-[#D4AF37] focus:ring-[#D4AF37] rounded-xl"
            />
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{alumni.length}</div>
                <div className="text-sm text-gray-500">Total Alumni</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center text-white">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{filteredAlumni.length}</div>
                <div className="text-sm text-gray-500">Hasil Pencarian</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {new Date().getFullYear()}
                </div>
                <div className="text-sm text-gray-500">Tahun Ini</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Alumni List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAlumni.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? 'Tidak ada alumni yang ditemukan' : 'Belum ada alumni terdaftar'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlumni.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100 group cursor-pointer"
              >
                {/* Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
                    {user.fullName?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 group-hover:text-[#D4AF37] transition-colors truncate">
                      {user.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {user.city && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                      <span className="truncate">{user.city}{user.province ? `, ${user.province}` : ''}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                    <span>
                      {user.createdAt 
                        ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('id-ID', { 
                            year: 'numeric', 
                            month: 'short' 
                          })
                        : '-'}
                    </span>
                  </div>
                </div>

                {/* Badge */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#D4AF37]/10 to-[#C5A572]/10 rounded-full">
                    <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="text-xs font-medium text-[#D4AF37]">Alumni Jamaah</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniListPage;
