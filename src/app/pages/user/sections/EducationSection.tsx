import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { toast } from 'sonner';

interface Education {
  id: string;
  title: string;
  description: string;
  category: string;
  emoji: string;
  content: string;
  imageUrl: string;
  backgroundColor: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  status: string;
  createdAt: any;
}

interface EducationSectionProps {
  onViewEducationDetail: (educationId: string) => void;
  onViewAllEducation?: () => void; // ✅ NEW: Handler for "Lihat Semua"
}

const EducationSection: React.FC<EducationSectionProps> = ({ onViewEducationDetail, onViewAllEducation }) => {
  const [educations, setEducations] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEducations = async () => {
      try {
        const educationsQuery = query(
          collection(db, 'education'),
          where('status', '==', 'active')
        );
        const querySnapshot = await getDocs(educationsQuery);
        const educationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Education[];

        // Sort by createdAt descending
        educationsData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });

        setEducations(educationsData);
      } catch (error) {
        console.error('Error fetching educations:', error);
        toast.error('Failed to load education resources');
      } finally {
        setLoading(false);
      }
    };

    fetchEducations();
  }, []);

  const getColorClasses = (education: Education) => {
    // Extract color from backgroundColor (e.g., "#E3F2FD" -> "blue")
    const bgColor = education.backgroundColor.toLowerCase();
    let colorName = 'gray';

    if (bgColor.includes('e3f2fd') || bgColor.includes('blue')) colorName = 'blue';
    else if (bgColor.includes('e8f5e9') || bgColor.includes('green')) colorName = 'green';
    else if (bgColor.includes('fff8e1') || bgColor.includes('amber') || bgColor.includes('yellow')) colorName = 'amber';
    else if (bgColor.includes('f3e5f5') || bgColor.includes('purple')) colorName = 'purple';
    else if (bgColor.includes('fce4ec') || bgColor.includes('pink')) colorName = 'pink';

    return {
      gradient: `from-${colorName}-500/10 to-${colorName}-600/10`,
      border: education.borderColor || `border-${colorName}-200`,
      iconBg: education.iconBg || `bg-${colorName}-100`,
      iconColor: education.iconColor || `text-${colorName}-600`,
    };
  };



  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1692566123227-0f68f1b9dac6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWRpbmFoJTIwcHJvcGhldCUyMG1vc3F1ZXxlbnwxfHx8fDE3NjgxODU4NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Madinah Prophet Mosque"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/70 via-emerald-900/60 to-cyan-900/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/95" />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-15">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating Orbs */}
      <motion.div
        animate={{ y: [0, -25, 0], x: [0, 25, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-40 left-20 w-48 h-48 bg-gradient-to-br from-teal-300/20 to-emerald-400/20 rounded-full blur-3xl z-0"
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -20, 0], rotate: [0, 180, 360] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-40 right-20 w-56 h-56 bg-gradient-to-tl from-cyan-300/20 to-blue-400/20 rounded-full blur-3xl z-0"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 border-2 border-[#D4AF37]/30 mb-6"
          >
            <BookOpen className="w-10 h-10 text-[#D4AF37]" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-light mb-4">
            Sumber <span className="font-semibold bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent">Edukasi</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Persiapkan diri Anda dengan pengetahuan sebelum memulai perjalanan spiritual
          </p>
        </motion.div>

        {/* Education Grid - Optimized for 2 columns on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8 mb-12">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className={`rounded-2xl p-8 bg-gray-200 h-80`}></div>
              </div>
            ))
          ) : (
            educations.slice(0, 3).map((education, index) => { // ✅ LIMIT: Show only 3 cards
              const colors = getColorClasses(education);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group"
                >
                  <div className={`relative h-full p-4 sm:p-8 rounded-2xl bg-gradient-to-br ${colors.gradient} border ${colors.border} hover:border-[#D4AF37]/40 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden`}>
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Icon */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="relative mb-4 sm:mb-6"
                    >
                      <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl ${colors.iconBg} shadow-md`}>
                        <span className="text-2xl sm:text-5xl">{education.emoji}</span>
                      </div>
                    </motion.div>

                    {/* Content */}
                    <div className="relative">
                      <h3 className="text-base sm:text-2xl font-semibold mb-2 sm:mb-3 text-gray-900 group-hover:text-[#D4AF37] transition-colors line-clamp-1 sm:line-clamp-none">
                        {education.title}
                      </h3>
                      <p className="text-[10px] sm:text-base text-gray-600 leading-relaxed mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-none">
                        {education.description}
                      </p>

                      {/* Learn More Link */}
                      <button className="inline-flex items-center text-[10px] sm:text-base text-[#D4AF37] hover:text-[#F4D03F] font-semibold transition-colors group/btn" onClick={() => onViewEducationDetail(education.id)}>
                        <span>Detail</span>
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* View All Button */}
        {onViewAllEducation && educations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <button
              onClick={() => {
                onViewAllEducation?.(); // Navigate to All Education page
              }}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-white hover:bg-emerald-50 border-2 border-emerald-600 rounded-xl text-emerald-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span>Lihat Semua Edukasi</span>
              <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">→</span>
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default EducationSection;