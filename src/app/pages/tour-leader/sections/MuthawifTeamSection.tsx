import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Package,
  MessageCircle,
  Award,
  Globe,
  Calendar,
  Star,
  Building,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { toast } from 'sonner';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';

interface MuthawifData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  specialization?: string;
  experience?: string;
  languages?: string;
  certificateNumber?: string;
  packageName?: string;
  packageId?: string;
  itineraryId?: string;
}

const MuthawifTeamSection: React.FC = () => {
  const { userProfile } = useAuth();
  const [muthawifList, setMuthawifList] = useState<MuthawifData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMuthawif, setSelectedMuthawif] = useState<MuthawifData | null>(null);

  useEffect(() => {
    fetchMuthawifTeam();
  }, [userProfile]);

  const fetchMuthawifTeam = async () => {
    try {
      setLoading(true);

      if (!userProfile?.uid) {
        console.error('❌ No user profile UID');
        setMuthawifList([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching Muthawif team for Tour Leader:', {
        uid: userProfile.uid,
        email: userProfile.email,
        displayName: userProfile.displayName
      });

      // Step 1: Fetch itineraries - Try multiple query approaches
      // Approach 1: Query by tourLeaderId
      let itinerariesSnapshot;
      
      try {
        const itinerariesQuery1 = query(
          collection(db, 'itineraries'),
          where('tourLeaderId', '==', userProfile.uid)
        );
        itinerariesSnapshot = await getDocs(itinerariesQuery1);
        console.log('📊 Query 1 (tourLeaderId == uid):', itinerariesSnapshot.size, 'results');
      } catch (err) {
        console.log('Query 1 failed, trying approach 2');
      }

      // Approach 2: If no results, try with email
      if (!itinerariesSnapshot || itinerariesSnapshot.empty) {
        try {
          const itinerariesQuery2 = query(
            collection(db, 'itineraries'),
            where('tourLeaderId', '==', userProfile.email)
          );
          itinerariesSnapshot = await getDocs(itinerariesQuery2);
          console.log('📊 Query 2 (tourLeaderId == email):', itinerariesSnapshot.size, 'results');
        } catch (err) {
          console.log('Query 2 failed, trying approach 3');
        }
      }

      // Approach 3: If still no results, try with displayName
      if (!itinerariesSnapshot || itinerariesSnapshot.empty) {
        try {
          const itinerariesQuery3 = query(
            collection(db, 'itineraries'),
            where('tourLeaderName', '==', userProfile.displayName)
          );
          itinerariesSnapshot = await getDocs(itinerariesQuery3);
          console.log('📊 Query 3 (tourLeaderName == displayName):', itinerariesSnapshot.size, 'results');
        } catch (err) {
          console.log('Query 3 failed, trying approach 4');
        }
      }

      // Approach 4: Get ALL itineraries and filter manually
      if (!itinerariesSnapshot || itinerariesSnapshot.empty) {
        console.log('📊 Query 4: Fetching ALL itineraries and filtering manually');
        const allItinerariesQuery = query(collection(db, 'itineraries'));
        itinerariesSnapshot = await getDocs(allItinerariesQuery);
        console.log('📊 Total itineraries in DB:', itinerariesSnapshot.size);
        
        // Log all for debugging
        itinerariesSnapshot.forEach(doc => {
          const data = doc.data();
          console.log('Itinerary:', {
            id: doc.id,
            tourLeaderId: data.tourLeaderId,
            tourLeaderName: data.tourLeaderName,
            muthawifId: data.muthawifId,
            muthawifName: data.muthawifName,
            packageName: data.packageName
          });
        });
      }

      if (!itinerariesSnapshot || itinerariesSnapshot.empty) {
        console.log('❌ No itineraries found');
        setMuthawifList([]);
        setLoading(false);
        return;
      }

      // Step 2: Collect unique Muthawif IDs and their package info
      const muthawifMap = new Map<string, { packageName: string; packageId: string; itineraryId: string }>();

      for (const itineraryDoc of itinerariesSnapshot.docs) {
        const itinerary = itineraryDoc.data();
        
        // Check if this itinerary belongs to current tour leader
        const belongsToMe = 
          itinerary.tourLeaderId === userProfile.uid ||
          itinerary.tourLeaderId === userProfile.email ||
          itinerary.tourLeaderName === userProfile.displayName;

        if (!belongsToMe) continue;

        const muthawifId = itinerary.muthawifId;
        const muthawifName = itinerary.muthawifName;

        console.log('✅ Found matching itinerary:', {
          itineraryId: itineraryDoc.id,
          muthawifId,
          muthawifName,
          packageName: itinerary.packageName
        });

        if (muthawifId && !muthawifMap.has(muthawifId)) {
          muthawifMap.set(muthawifId, {
            packageName: itinerary.packageName || 'Unknown Package',
            packageId: itinerary.packageId || '',
            itineraryId: itineraryDoc.id
          });
        }
      }

      console.log('📋 Unique Muthawif found:', muthawifMap.size);

      if (muthawifMap.size === 0) {
        setMuthawifList([]);
        setLoading(false);
        return;
      }

      // Step 3: Fetch Muthawif profiles
      const muthawifDataList: MuthawifData[] = [];

      for (const [muthawifId, packageInfo] of muthawifMap.entries()) {
        try {
          console.log('🔍 Fetching Muthawif profile:', muthawifId);
          
          // Try to fetch from muthawifProfiles collection
          const muthawifProfileRef = doc(db, 'muthawifProfiles', muthawifId);
          const muthawifProfileSnap = await getDoc(muthawifProfileRef);

          if (muthawifProfileSnap.exists()) {
            const profileData = muthawifProfileSnap.data();
            console.log('✅ Found in muthawifProfiles:', profileData);
            
            muthawifDataList.push({
              id: muthawifId,
              fullName: profileData.fullName || 'Muthawif',
              email: profileData.email || '-',
              phoneNumber: profileData.phoneNumber || '',
              whatsappNumber: profileData.whatsappNumber || profileData.phoneNumber || '',
              specialization: profileData.specialization || '',
              experience: profileData.experience || '',
              languages: profileData.languages || '',
              certificateNumber: profileData.certificateNumber || '',
              packageName: packageInfo.packageName,
              packageId: packageInfo.packageId,
              itineraryId: packageInfo.itineraryId
            });
          } else {
            // Fallback: Fetch from users collection
            console.log('⚠️ Not in muthawifProfiles, trying users collection');
            const userRef = doc(db, 'users', muthawifId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();
              console.log('✅ Found in users:', userData);
              
              muthawifDataList.push({
                id: muthawifId,
                fullName: userData.displayName || 'Muthawif',
                email: userData.email || '-',
                phoneNumber: userData.phoneNumber || '',
                whatsappNumber: userData.phoneNumber || '',
                packageName: packageInfo.packageName,
                packageId: packageInfo.packageId,
                itineraryId: packageInfo.itineraryId
              });
            } else {
              console.log('❌ Muthawif not found in users either:', muthawifId);
            }
          }
        } catch (error) {
          console.error('Error fetching muthawif:', muthawifId, error);
        }
      }

      console.log('✅ Final Muthawif list:', muthawifDataList.length, 'items');
      setMuthawifList(muthawifDataList);

    } catch (error) {
      console.error('Error fetching Muthawif team:', error);
      toast.error('Gagal memuat data Muthawif');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data Muthawif...</p>
        </div>
      </div>
    );
  }

  if (muthawifList.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center mx-auto mb-6">
          <User className="w-10 h-10 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Muthawif Ditugaskan</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Saat ini belum ada Muthawif yang ditugaskan untuk bekerja dengan Anda. Silakan hubungi admin untuk informasi lebih lanjut.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6 text-[#D4AF37]" />
            Tim Muthawif ({muthawifList.length})
          </h2>
          <p className="text-gray-600 mt-1">Daftar Muthawif yang bekerja bersama Anda</p>
        </div>
      </div>

      {/* Muthawif Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {muthawifList.map((muthawif, index) => (
          <motion.div
            key={muthawif.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
            onClick={() => setSelectedMuthawif(muthawif)}
          >
            {/* Header - Gold Gradient */}
            <div className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] p-5">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                
                {/* Name */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg mb-1 truncate">{muthawif.fullName}</h3>
                  <div className="flex items-center gap-1.5 text-white/90">
                    <Award className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs truncate">Muthawif Profesional</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Body - Info */}
            <div className="p-5 space-y-3.5">
              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5 font-medium">Email</p>
                  <p className="text-sm text-gray-900 truncate">{muthawif.email}</p>
                </div>
              </div>

              {/* Phone */}
              {muthawif.phoneNumber && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-0.5 font-medium">Telepon</p>
                    <p className="text-sm text-gray-900">{muthawif.phoneNumber}</p>
                  </div>
                </div>
              )}

              {/* Specialization */}
              {muthawif.specialization && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5 font-medium">Spesialisasi</p>
                    <p className="text-sm text-gray-900 truncate">{muthawif.specialization}</p>
                  </div>
                </div>
              )}

              {/* Languages */}
              {muthawif.languages && (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5 font-medium">Bahasa</p>
                    <p className="text-sm text-gray-900 truncate">{muthawif.languages}</p>
                  </div>
                </div>
              )}

              {/* Package - Highlighted */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 -mx-5 -mb-5 px-5 py-4 mt-4 border-t-2 border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#C19B2B] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-amber-700 mb-0.5 font-bold uppercase tracking-wide">Paket Bersama</p>
                    <p className="text-sm text-amber-900 font-bold truncate">{muthawif.packageName}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMuthawif && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMuthawif(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] p-6 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center shadow-lg">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedMuthawif.fullName}</h3>
                      <p className="text-white/90 text-sm">Muthawif Profesional</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMuthawif(null)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-5 space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <Phone className="w-5 h-5 text-[#D4AF37]" />
                      Informasi Kontak
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1 font-medium">Email</p>
                        <p className="text-sm text-gray-900">{selectedMuthawif.email}</p>
                      </div>
                      
                      {selectedMuthawif.phoneNumber && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium">Nomor Telepon</p>
                          <p className="text-sm text-gray-900">{selectedMuthawif.phoneNumber}</p>
                        </div>
                      )}
                      
                      {selectedMuthawif.whatsappNumber && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium">WhatsApp</p>
                          <p className="text-sm text-gray-900">{selectedMuthawif.whatsappNumber}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Info */}
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-5 space-y-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <Award className="w-5 h-5 text-[#D4AF37]" />
                      Informasi Profesional
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {selectedMuthawif.specialization && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium">Spesialisasi</p>
                          <p className="text-sm text-gray-900">{selectedMuthawif.specialization}</p>
                        </div>
                      )}
                      
                      {selectedMuthawif.experience && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium">Pengalaman</p>
                          <p className="text-sm text-gray-900">{selectedMuthawif.experience} tahun</p>
                        </div>
                      )}
                      
                      {selectedMuthawif.languages && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium">Bahasa</p>
                          <p className="text-sm text-gray-900">{selectedMuthawif.languages}</p>
                        </div>
                      )}
                      
                      {selectedMuthawif.certificateNumber && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1 font-medium">No. Sertifikat</p>
                          <p className="text-sm text-gray-900">{selectedMuthawif.certificateNumber}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Package Info */}
                <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
                  <CardContent className="p-5">
                    <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-amber-700" />
                      Paket yang Ditangani Bersama
                    </h4>
                    <p className="text-amber-900 font-semibold text-lg">{selectedMuthawif.packageName}</p>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {selectedMuthawif.whatsappNumber && (
                    <a
                      href={`https://wa.me/${selectedMuthawif.whatsappNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Hubungi via WhatsApp
                      </Button>
                    </a>
                  )}
                  <a
                    href={`mailto:${selectedMuthawif.email}`}
                    className="flex-1"
                  >
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Mail className="w-4 h-4 mr-2" />
                      Kirim Email
                    </Button>
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MuthawifTeamSection;