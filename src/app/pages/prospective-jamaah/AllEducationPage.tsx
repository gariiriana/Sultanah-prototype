import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../../contexts/AuthContext';

// ✅ LOGO: Sultanah local logo
const sultanahLogo = '/images/logo.png';

interface AllEducationPageProps {
  educations: any[];
  onBack: () => void;
  onSelectEducation: (education: any) => void;
}

const AllEducationPage: React.FC<AllEducationPageProps> = ({ educations, onBack, onSelectEducation }) => {
  const { currentUser } = useAuth();
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Jamaah';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Beautiful Header with Background Image */}
      <div className="relative h-52 overflow-hidden">
        {/* Background Image - Medina Mosque */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1724191078796-8a997b989f43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpbmElMjBtb3NxdWUlMjBpc2xhbWljfGVufDF8fHx8MTc2Nzc3Mjg5Nnww&ixlib=rb-4.1.0&q=80&w=1080)`
          }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        </div>

        {/* Content on top of image */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 py-6 flex flex-col justify-between">
          {/* Top: Logo, Welcome Text, and Back Button */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <img src={sultanahLogo} alt="Sultanah" className="w-12 h-12 object-contain drop-shadow-2xl" />

              {/* Welcome Text */}
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  Welcome Detail Edukasi
                </h1>
                <p className="text-sm text-white/90 mt-0.5 drop-shadow">
                  Halo, {userName}
                </p>
              </div>
            </div>

            {/* Back Button */}
            <Button
              onClick={onBack}
              className="bg-white/95 backdrop-blur-sm hover:bg-white text-gray-900 h-9 px-4 text-sm shadow-lg flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </div>

          {/* Bottom: Education Count Badge */}
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 inline-block self-start shadow-md">
            <p className="text-sm font-semibold text-gray-900">
              {educations.length} Panduan Tersedia
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {educations.map((education, index) => (
            <motion.div
              key={education.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="relative h-48 bg-gradient-to-br from-[#D4AF37] to-[#C5A572]">
                {education.imageUrl ? (
                  <img
                    src={education.imageUrl}
                    alt={education.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white/80" />
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 right-3">
                  <div className="px-3 py-1 rounded bg-white/90 flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-[#D4AF37]" />
                    <span className="text-xs font-bold text-gray-900">
                      {education.category || 'Panduan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                  {education.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {education.description}
                </p>

                {/* Topics */}
                {education.topics && education.topics.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {education.topics.slice(0, 3).map((topic: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-orange-50 text-[#D4AF37] text-xs font-semibold"
                        >
                          {topic}
                        </span>
                      ))}
                      {education.topics.length > 3 && (
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-semibold">
                          +{education.topics.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Button */}
                <Button
                  onClick={() => onSelectEducation(education)}
                  className="w-full bg-[#D4AF37] hover:bg-[#C5A572] text-white"
                >
                  Pelajari Sekarang
                </Button>

                {/* Footer */}
                <div className="mt-3 text-center">
                  <span className="text-xs text-gray-500">Gratis & Mudah Dipahami</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {educations.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Tidak Ada Panduan Tersedia</h3>
            <p className="text-sm text-gray-600">Panduan edukasi umrah akan segera hadir.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllEducationPage;