import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import { motion } from 'motion/react';

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

interface EducationDetailPageProps {
  educationId: string;
  onBack: () => void;
}

const EducationDetailPage: React.FC<EducationDetailPageProps> = ({ educationId, onBack }) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail edukasi...</p>
        </div>
      </div>
    );
  }

  if (!educationData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Konten Tidak Ditemukan</h3>
          <Button onClick={onBack} variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] text-white py-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white hover:bg-white/20 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Edukasi
          </Button>

          {/* Title & Emoji */}
          <div className="flex items-start gap-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex-shrink-0"
            >
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                <span className="text-6xl">{educationData.emoji}</span>
              </div>
            </motion.div>
            <div className="flex-1">
              <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30">
                {educationData.category}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {educationData.title}
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                {educationData.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="shadow-xl border-0 overflow-hidden">
          {/* Image if available */}
          {educationData.imageUrl && (
            <div className="relative h-96 overflow-hidden">
              <img
                src={educationData.imageUrl}
                alt={educationData.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          )}

          <CardContent className="p-8 md:p-12">
            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-700 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: educationData.content.replace(/\n/g, '<br />') }}
              />
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-12" />

            {/* Bottom Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {educationData.createdAt?.toDate?.().toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) || 'Tanggal tidak tersedia'}
                </span>
              </div>

              <Button
                onClick={onBack}
                className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] text-white hover:opacity-90 transition-opacity"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Kembali ke Edukasi
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-[#D4AF37]/10 via-[#FFD700]/10 to-[#D4AF37]/10 border-[#D4AF37]/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Butuh Informasi Lebih Lanjut?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Jika Anda memiliki pertanyaan tentang materi ini atau ingin konsultasi lebih lanjut mengenai perjalanan Umrah, 
                    silakan hubungi tim kami melalui halaman kontak atau WhatsApp.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default EducationDetailPage;
