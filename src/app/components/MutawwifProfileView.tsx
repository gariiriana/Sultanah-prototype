import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Award,
  Book,
  Languages,
  Briefcase,
  X,
  Star
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';

interface MutawwifProfile {
  userId: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  photoURL?: string;
  bio?: string;
  address?: string;
  birthDate?: string;
  gender?: string;
  expertise?: string[];
  languages?: string[];
  certifications?: string;
  experience?: string;
  education?: string;
  specialization?: string;
  isPublic: boolean;
  updatedAt: any;
}

interface MutawwifProfileViewProps {
  mutawwifId: string;
  onClose?: () => void;
}

const MutawwifProfileView: React.FC<MutawwifProfileViewProps> = ({ mutawwifId, onClose }) => {
  const [profile, setProfile] = useState<MutawwifProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [mutawwifId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch from user document
      const userRef = doc(db, 'users', mutawwifId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const mutawwifData = userData.mutawwifProfile || {};

        // Only show if profile is public
        if (mutawwifData.isPublic !== false) {
          setProfile({
            userId: mutawwifId,
            email: userData.email || '',
            displayName: mutawwifData.displayName || userData.displayName || '',
            phoneNumber: mutawwifData.phoneNumber || userData.phoneNumber || '',
            photoURL: mutawwifData.photoURL || userData.photoURL || '',
            bio: mutawwifData.bio || '',
            address: mutawwifData.address || '',
            birthDate: mutawwifData.birthDate || '',
            gender: mutawwifData.gender || '',
            expertise: mutawwifData.expertise || [],
            languages: mutawwifData.languages || [],
            certifications: mutawwifData.certifications || '',
            experience: mutawwifData.experience || '',
            education: mutawwifData.education || '',
            specialization: mutawwifData.specialization || '',
            isPublic: mutawwifData.isPublic !== false,
            updatedAt: mutawwifData.updatedAt,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <div className="w-28 h-28 mx-auto bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mb-6">
          <User className="w-14 h-14 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Profil Tidak Ditemukan
        </h3>
        <p className="text-gray-500">
          Profil mutawwif ini tidak tersedia atau belum dipublikasikan
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Close Button for Modal */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 border border-gray-200 shadow-lg"
      >
        <div className="flex items-start gap-8">
          {/* Photo */}
          <div className="relative">
            {profile.photoURL ? (
              <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-[#D4AF37] shadow-xl">
                <img 
                  src={profile.photoURL} 
                  alt={profile.displayName} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#C5A572] to-[#D4AF37] flex items-center justify-center border-4 border-[#D4AF37] shadow-xl">
                <User className="w-16 h-16 text-white" />
              </div>
            )}
            
            {/* Verified Badge */}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{profile.displayName}</h2>
            
            <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4AF37]" />
                <span>{profile.email}</span>
              </div>
              {profile.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  <span>{profile.phoneNumber}</span>
                </div>
              )}
            </div>

            {profile.bio && (
              <p className="text-gray-700 leading-relaxed bg-[#D4AF37]/5 p-4 rounded-2xl border border-[#D4AF37]/20">
                {profile.bio}
              </p>
            )}

            {profile.specialization && (
              <div className="mt-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white rounded-full text-sm font-semibold shadow-lg">
                  <Award className="w-4 h-4" />
                  {profile.specialization}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Detailed Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Personal Info */}
          {profile.address && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md"
            >
              <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-[#D4AF37]" />
                Alamat
              </h4>
              <p className="text-gray-700">{profile.address}</p>
            </motion.div>
          )}

          {/* Education */}
          {profile.education && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md"
            >
              <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Book className="w-5 h-5 text-[#D4AF37]" />
                Pendidikan
              </h4>
              <p className="text-gray-700 whitespace-pre-line">{profile.education}</p>
            </motion.div>
          )}

          {/* Languages */}
          {profile.languages && profile.languages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md"
            >
              <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Languages className="w-5 h-5 text-[#D4AF37]" />
                Bahasa yang Dikuasai
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg text-sm font-medium"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Experience */}
          {profile.experience && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md"
            >
              <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Briefcase className="w-5 h-5 text-[#D4AF37]" />
                Pengalaman
              </h4>
              <p className="text-gray-700 whitespace-pre-line">{profile.experience}</p>
            </motion.div>
          )}

          {/* Certifications */}
          {profile.certifications && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 border border-gray-200 shadow-md"
            >
              <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-[#D4AF37]" />
                Sertifikasi
              </h4>
              <p className="text-gray-700 whitespace-pre-line">{profile.certifications}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-[#C5A572]/10 via-[#D4AF37]/10 to-[#F4D03F]/10 rounded-3xl p-8 border border-[#D4AF37]/30"
      >
        <h4 className="font-bold text-gray-900 text-xl mb-4 text-center">
          Hubungi Mutawwif
        </h4>
        <div className="flex justify-center gap-4">
          {profile.phoneNumber && (
            <Button 
              onClick={() => window.open(`https://wa.me/${profile.phoneNumber.replace(/\D/g, '')}`, '_blank')}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6 shadow-lg"
            >
              <Phone className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          )}
          <Button 
            onClick={() => window.location.href = `mailto:${profile.email}`}
            className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white rounded-xl px-6 shadow-lg"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default MutawwifProfileView;