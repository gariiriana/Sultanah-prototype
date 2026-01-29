import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, FileText, Newspaper, Search, Filter, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../../contexts/AuthContext';
import { Article } from '../../../types';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion } from 'motion/react';

interface ArticlesPageProps {
  onBack: () => void;
  onShowArticleDetail: (articleId: string) => void;
  onShowCreateArticle?: () => void; // Optional - only for roles that can create articles
}

const ArticlesPage: React.FC<ArticlesPageProps> = ({ onBack, onShowArticleDetail, onShowCreateArticle }) => {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);

  const categories = [
    { id: 'all', label: 'Semua', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
    { id: 'article', label: 'Artikel', icon: FileText, color: 'from-gold via-gold-light to-gold-dark' },
    { id: 'news', label: 'Berita', icon: Newspaper, color: 'from-green-500 to-green-600' },
  ];

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const articlesRef = collection(db, 'articles');
      
      // ✅ Simplified query - removed orderBy to avoid composite index requirement
      let q = query(
        articlesRef,
        where('status', '==', 'approved'),
        limit(50)
      );

      if (selectedCategory !== 'all') {
        q = query(
          articlesRef,
          where('status', '==', 'approved'),
          where('category', '==', selectedCategory),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      const articlesData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((article: any) => article.deleted !== true) as Article[];

      // ✅ Sort by createdAt on client-side to avoid index requirement
      articlesData.sort((a, b) => {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        return dateB - dateA; // Descending order (newest first)
      });

      console.log('✅ Fetched articles:', articlesData.length, articlesData);

      setArticles(articlesData);

      // Get featured articles
      const featured = articlesData.filter(a => a.featured).slice(0, 3);
      setFeaturedArticles(featured);
    } catch (error) {
      console.error('❌ Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article => {
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.content?.toLowerCase().includes(query) ||
      article.category?.toLowerCase().includes(query)
    );
  });

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.color || 'from-gray-500 to-gray-600';
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.id === category);
    return cat?.label || category;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ✨ Enhanced Header with Background Image - EXTRA COMPACT */}
      <div className="relative bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] text-white py-8 sm:py-10 overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1698967406711-ede239b6c07e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpc2xhbWljJTIwbW9zcXVlJTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc2NzE3NDI3OXww&ixlib=rb-4.1.0&q=80&w=1080')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#C5A572]/95 via-[#D4AF37]/90 to-[#F4D03F]/95"></div>
        </div>

        {/* Islamic Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse delay-500"></div>

        <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 z-10">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-3 sm:mb-4"
          >
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-white hover:bg-white/20 backdrop-blur-sm gap-1.5 text-sm px-3 py-1.5 h-auto rounded-full border border-white/30 hover:border-white/50 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Button>
          </motion.div>

          {/* Title with Icon - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            {/* Icon Header - Smaller */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl mb-3 border border-white/30 shadow-xl"
            >
              <BookOpen className="w-6 h-6 text-white" />
            </motion.div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg">
              ✨ Berita & Artikel Islami
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-white/90 max-w-xl mx-auto px-4 drop-shadow-md">
              Bagikan pengalaman spiritual Anda dengan jamaah lainnya dan dapatkan inspirasi dari kisah perjalanan umroh yang penuh berkah
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {/* Search & Create Button */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent text-sm sm:text-base"
            />
          </div>

          {/* Submit Article Button - Only for roles that can create articles */}
          {currentUser && onShowCreateArticle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={onShowCreateArticle}
                className="relative overflow-hidden bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white gap-2 sm:gap-3 px-4 sm:px-6 py-4 sm:py-7 rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all w-full sm:w-auto group"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] via-[#D4AF37] to-[#C5A572] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Content */}
                <div className="relative flex items-center justify-center gap-2 sm:gap-3 w-full">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-sm sm:text-base md:text-lg">
                      Bagikan Pengalaman Spiritual Anda
                    </span>
                    <span className="text-[10px] sm:text-xs text-white/80 font-normal hidden sm:block">
                      Inspirasi untuk jamaah lainnya
                    </span>
                  </div>
                </div>
              </Button>
            </motion.div>
          )}
        </div>

        {/* Category Filters */}
        <div className="mb-8 sm:mb-12 overflow-x-auto pb-4 -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex gap-2 sm:gap-3 min-w-max">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                    isActive
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg scale-105`
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gold'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Articles */}
        {selectedCategory === 'all' && featuredArticles.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-gold" />
              Artikel Pilihan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {featuredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onShowArticleDetail(article.id)}
                  className="group cursor-pointer bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold text-white bg-gradient-to-r ${getCategoryColor(article.category)}`}>
                        {getCategoryLabel(article.category)}
                      </span>
                    </div>
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      <span className="px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold text-white bg-gold/90 backdrop-blur-sm">
                        ⭐ Pilihan
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gold transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
                      {article.content?.substring(0, 150)}...
                    </p>
                    
                    {/* Meta - Author Only */}
                    <div className="text-[10px] sm:text-xs text-gray-500">
                      <span className="font-medium text-gold truncate">{article.author?.name || 'Anonymous'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Articles */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            {selectedCategory === 'all' ? 'Semua Artikel' : getCategoryLabel(selectedCategory)}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-gold"></div>
              <p className="mt-4 text-gray-600 text-sm sm:text-base">Memuat artikel...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-200">
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">Belum ada artikel tersedia</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {filteredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onShowArticleDetail(article.id)}
                  className="group cursor-pointer bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gold"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Thumbnail - Top on mobile, Left on desktop */}
                    <div className="w-full md:w-64 lg:w-80 h-48 sm:h-56 md:h-auto relative overflow-hidden flex-shrink-0">
                      {article.image ? (
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold text-white bg-gradient-to-r ${getCategoryColor(article.category)}`}>
                          {getCategoryLabel(article.category)}
                        </span>
                      </div>
                    </div>

                    {/* Content - Bottom on mobile, Right on desktop */}
                    <div className="flex-1 p-4 sm:p-6 md:p-8">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-gold transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                        {article.content?.substring(0, 200)}...
                      </p>

                      {/* Category Badge - Hidden on mobile (already shown on image) */}
                      <div className="mb-3 sm:mb-4 hidden md:block">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {article.category === 'news' ? '📰 Berita' : '📝 Artikel'}
                        </span>
                      </div>

                      {/* Meta Info - Author and Date Only */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{article.author?.name || 'Anonymous'}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">
                            {article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticlesPage;