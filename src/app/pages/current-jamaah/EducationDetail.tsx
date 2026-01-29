import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface Education {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  imageUrl: string;
  duration?: string;
  level?: string;
  status: string;
  createdAt: any;
}

interface EducationDetailProps {
  educationId: string;
  onBack: () => void;
}

const EducationDetail: React.FC<EducationDetailProps> = ({ educationId, onBack }) => {
  const [educationData, setEducationData] = useState<Education | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEducationDetail();
  }, [educationId]);

  const fetchEducationDetail = async () => {
    try {
      const docRef = doc(db, 'education', educationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setEducationData({ id: docSnap.id, ...docSnap.data() } as Education);
      } else {
        toast.error('Konten edukasi tidak ditemukan');
        onBack();
      }
    } catch (error) {
      console.error('Error fetching education:', error);
      toast.error('Gagal memuat detail edukasi');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#D4AF37] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Memuat detail edukasi...</p>
        </div>
      </div>
    );
  }

  if (!educationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-700 mb-2">Konten Tidak Ditemukan</h3>
          <p className="text-gray-500 mb-6">Konten edukasi yang Anda cari tidak tersedia</p>
          <Button 
            onClick={onBack} 
            variant="outline" 
            className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#FFF9F0]">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              onClick={onBack}
              variant="ghost" 
              className="bg-white/50 hover:bg-white/80 text-gray-700 border border-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Image & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {educationData.imageUrl && (
            <Card className="overflow-hidden mb-8 shadow-2xl border-2 border-[#D4AF37]/20">
              <div className="relative h-96">
                <img
                  src={educationData.imageUrl}
                  alt={educationData.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* Category Badge */}
                {educationData.category && (
                  <div className="absolute top-6 left-6">
                    <span className="px-6 py-2 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A572] text-white font-semibold shadow-xl text-sm">
                      {educationData.category}
                    </span>
                  </div>
                )}

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-2xl">
                    {educationData.title}
                  </h1>
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-white/90">
                    {educationData.duration && (
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{educationData.duration}</span>
                      </div>
                    )}
                    {educationData.level && (
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <BookOpen className="w-4 h-4" />
                        <span className="font-medium">{educationData.level}</span>
                      </div>
                    )}
                    {educationData.createdAt && (
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{formatDate(educationData.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Description */}
          {educationData.description && (
            <Card className="mb-8 shadow-lg border-2 border-[#D4AF37]/10">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Deskripsi</h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {educationData.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          {educationData.content && (
            <Card className="shadow-lg border-2 border-[#D4AF37]/10">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-[#D4AF37] to-[#C5A572] rounded-full"></div>
                  Materi Lengkap
                </h3>
                <div 
                  className="prose prose-lg max-w-none"
                  style={{
                    color: '#374151',
                    lineHeight: '1.8'
                  }}
                >
                  {/* Render content with preserved formatting */}
                  {educationData.content.split('\n').map((paragraph, index) => {
                    if (paragraph.trim() === '') {
                      return <br key={index} />;
                    }
                    
                    // Check if it's a heading (starts with # or ##)
                    if (paragraph.startsWith('# ')) {
                      return (
                        <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                          {paragraph.substring(2)}
                        </h2>
                      );
                    }
                    if (paragraph.startsWith('## ')) {
                      return (
                        <h3 key={index} className="text-xl font-bold text-gray-800 mt-6 mb-3">
                          {paragraph.substring(3)}
                        </h3>
                      );
                    }
                    
                    // Check if it's a list item
                    if (paragraph.trim().startsWith('- ') || paragraph.trim().startsWith('• ')) {
                      return (
                        <li key={index} className="ml-6 mb-2 text-gray-700">
                          {paragraph.trim().substring(2)}
                        </li>
                      );
                    }
                    
                    // Check if it's numbered list
                    if (/^\d+\./.test(paragraph.trim())) {
                      return (
                        <li key={index} className="ml-6 mb-2 text-gray-700 list-decimal">
                          {paragraph.trim().replace(/^\d+\.\s*/, '')}
                        </li>
                      );
                    }
                    
                    // Regular paragraph
                    return (
                      <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Back Button at Bottom */}
          <div className="mt-8 text-center">
            <Button
              onClick={onBack}
              className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white font-semibold px-8 py-6 rounded-xl shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Kembali ke Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EducationDetail;
