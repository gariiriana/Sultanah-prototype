import React from 'react';
import { motion } from 'motion/react';
import { Newspaper, Calendar, User } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  image?: string; // ✅ ADD: Support both imageUrl and image field
  author?: string;
  createdAt: any;
  status?: string;
}

interface ArticleSectionProps {
  articles: Article[];
  loading: boolean;
  emptyMessage?: string;
  onArticleClick?: (articleId: string) => void;
  showSubmitButton?: boolean;
  onSubmitClick?: () => void;
  maxItems?: number; // ✅ NEW: Limit number of items to display (default: show all)
}

const ArticleSection: React.FC<ArticleSectionProps> = ({
  articles,
  loading,
  emptyMessage = 'Belum ada artikel',
  onArticleClick,
  showSubmitButton = false,
  onSubmitClick,
  maxItems, // ✅ FIXED: Don't set default here to avoid circular reference
}) => {
  // ✅ FIXED: Set default value inside component body
  const displayLimit = maxItems !== undefined ? maxItems : articles.length;

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Panduan Umrah': 'bg-blue-100 text-blue-700',
      'Panduan Haji': 'bg-purple-100 text-purple-700',
      'Tips & Trik': 'bg-green-100 text-green-700',
      'Doa & Zikir': 'bg-amber-100 text-amber-700',
      'Inspirasi': 'bg-pink-100 text-pink-700',
      'Berita': 'bg-red-100 text-red-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        <p className="mt-4 text-gray-600">Memuat artikel...</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardContent className="p-12">
          <div className="text-center">
            <Newspaper className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-2 text-gray-800">{emptyMessage}</h3>
            <p className="text-gray-600 mb-6">
              Artikel dan berita terbaru akan segera tersedia
            </p>
            {showSubmitButton && onSubmitClick && (
              <button
                onClick={onSubmitClick}
                className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Newspaper className="w-4 h-4 inline mr-2" />
                Tulis Artikel Pertama
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.slice(0, displayLimit).map((article, index) => (
        <motion.div
          key={article.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className="bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 h-full cursor-pointer group"
            onClick={() => onArticleClick && onArticleClick(article.id)}
          >
            {/* Article Image - Support both imageUrl and image field */}
            {(article.imageUrl || article.image) && (
              <div className="h-48 overflow-hidden rounded-t-lg">
                <img
                  src={article.imageUrl || article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}

            <CardContent className="p-6">
              {/* Category Badge */}
              <div className="mb-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                  {article.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                {article.title}
              </h3>

              {/* Content Preview */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {article.content}
              </p>

              {/* Meta Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                {article.author && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{article.author}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(article.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ArticleSection;