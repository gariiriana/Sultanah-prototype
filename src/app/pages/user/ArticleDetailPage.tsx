import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { doc, getDoc, collection, query, where, getDocs, Timestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  Tag,
  Share2,
  Facebook,
  Twitter,
  MessageCircle,
  Bookmark,
  BookmarkCheck,
  Eye,
  Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import UserLayout from './UserLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { copyToClipboard } from '../../../utils/clipboard'; // ✅ Import safe clipboard utility
import { Article } from '../../../types'; // ✅ Import Article type

interface ArticleDetailPageProps {
  articleId: string;
  onBack: () => void;
}

const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({ articleId, onBack }) => {
  const { currentUser, userProfile } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    fetchArticle();
    incrementViewCount();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const articleRef = doc(db, 'articles', articleId);
      const articleSnap = await getDoc(articleRef);

      if (articleSnap.exists()) {
        const articleData = {
          id: articleSnap.id,
          ...articleSnap.data()
        } as Article;

        setArticle(articleData);
        setViewCount(articleData.views || 0);
      } else {
        toast.error('Artikel tidak ditemukan');
        onBack();
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Gagal memuat artikel');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      const articleRef = doc(db, 'articles', articleId);
      await updateDoc(articleRef, {
        views: increment(1)
      });
    } catch (error: any) {
      // Silent fail for view count - not critical
      // This can happen if user is not authenticated or lacks permissions
      if (error.code !== 'permission-denied') {
        console.error('Error incrementing view count:', error);
      }
    }
  };

  const handleShare = async () => {
    if (!article) return;
    
    try {
      // Try native share API first (works on mobile and some desktop browsers)
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: `${article.title}\n\n${article.content?.substring(0, 150)}...`,
          url: window.location.href
        });
        toast.success('Artikel berhasil dibagikan! 🎉');
      } else {
        // ✅ Use safe clipboard utility as fallback
        const success = await copyToClipboard(window.location.href);
        if (success) {
          toast.success('✅ Link artikel berhasil disalin ke clipboard!');
        } else {
          toast.error('❌ Gagal menyalin link. Silakan salin URL secara manual.');
        }
      }
    } catch (error: any) {
      // User cancelled share
      if (error.name === 'AbortError') {
        return;
      }
      
      console.error('Error sharing:', error);
      toast.error('❌ Gagal membagikan artikel.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-4 border-[#D4AF37] mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base">Memuat artikel...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4 text-sm md:text-base">Artikel tidak ditemukan</p>
          <Button onClick={onBack} className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700]">
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'news':
        return { label: 'Berita', icon: '📰', color: 'from-green-500 to-emerald-600' };
      case 'article':
        return { label: 'Artikel', icon: '📝', color: 'from-[#D4AF37] to-[#FFD700]' };
      default:
        return { label: category, icon: '📄', color: 'from-blue-500 to-blue-600' };
    }
  };

  const categoryInfo = getCategoryBadge(article.category);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with Image */}
      <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] overflow-hidden bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900">
        {/* Background Image */}
        {article.image && (
          <div className="absolute inset-0">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover opacity-40"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          </div>
        )}

        {/* Content Overlay */}
        <div className="relative h-full flex flex-col justify-end">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 md:pb-12 w-full">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-3 sm:mb-4 md:mb-6"
            >
              <Button
                onClick={onBack}
                variant="ghost"
                className="text-white hover:bg-white/20 gap-1 sm:gap-2 backdrop-blur-sm text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 h-auto"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Kembali</span>
              </Button>
            </motion.div>

            {/* Category Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-2 sm:mb-3 md:mb-4"
            >
              <span className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r ${categoryInfo.color} backdrop-blur-sm`}>
                <span className="text-sm sm:text-base">{categoryInfo.icon}</span>
                <span>{categoryInfo.label}</span>
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight"
            >
              {article.title}
            </motion.h1>

            {/* Meta Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-6 text-white/90 text-xs sm:text-sm"
            >
              {/* Author */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center text-white font-bold text-xs sm:text-sm md:text-base">
                  {article.author?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-semibold text-xs sm:text-sm">{article.author?.name || 'Anonymous'}</p>
                  <p className="text-[10px] sm:text-xs text-white/70 capitalize">{article.author?.role || 'Jamaah'}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                <span className="text-[10px] sm:text-xs md:text-sm">
                  {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>

              {/* Read Time */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                <span className="text-[10px] sm:text-xs md:text-sm">
                  {Math.ceil((article.content?.length || 0) / 1000)} mnt
                </span>
              </div>

              {/* Views */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                <span className="text-[10px] sm:text-xs md:text-sm">{viewCount}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-12">
        {/* Action Buttons - Sticky */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="sticky top-2 sm:top-3 md:top-4 z-10 mb-4 sm:mb-6 md:mb-8"
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-2.5 sm:p-3 md:p-4">
            {/* Mobile Layout */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1">
                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all flex-1 sm:flex-initial text-xs sm:text-sm"
                >
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Bagikan</span>
                </button>
              </div>

              {/* Featured Badge */}
              {article.featured && (
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-white">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm font-bold">Artikel Pilihan</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Article Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8 lg:p-12"
        >
          {/* Content */}
          <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm sm:text-base md:text-lg">
              {article.content}
            </div>
          </div>

          {/* Tags (if any) */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-6 sm:mt-8 md:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-full text-xs sm:text-sm font-medium border border-gray-200 hover:border-[#D4AF37] transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author Info Card */}
          <div className="mt-6 sm:mt-8 md:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
            <div className="bg-gradient-to-br from-[#FFF9F0] to-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-[#D4AF37]/20">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Tentang Penulis</h3>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center text-white font-bold text-lg sm:text-xl md:text-2xl flex-shrink-0">
                  {article.author?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-base sm:text-lg mb-1 truncate">
                    {article.author?.name || 'Anonymous'}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 capitalize mb-2 truncate">
                    {article.author?.role || 'Jamaah'} {article.author?.email && `• ${article.author.email}`}
                  </p>
                  {article.author?.phone && (
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      📱 {article.author.phone}
                    </p>
                  )}
                  {article.author?.socialMedia && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">
                      🔗 {article.author.socialMedia}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-4 sm:mt-6 md:mt-8 flex items-center justify-center"
        >
          <Button
            onClick={onBack}
            variant="outline"
            className="gap-2 border-2 border-gray-200 hover:border-[#D4AF37] w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Daftar Artikel
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default ArticleDetailPage;