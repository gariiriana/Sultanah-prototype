import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Newspaper, Calendar, Eye, Tag, Search } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../../config/firebase';

interface AlumniNewsPageProps {
  onBack: () => void;
}

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  author: string;
  imageUrl?: string;
  views: number;
  createdAt: any;
  publishedAt?: any;
}

const AlumniNewsPage: React.FC<AlumniNewsPageProps> = ({ onBack }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);

  const categories = [
    { id: 'all', label: 'Semua' },
    { id: 'umroh', label: 'Umroh' },
    { id: 'haji', label: 'Haji' },
    { id: 'tips', label: 'Tips & Panduan' },
    { id: 'news', label: 'Berita' },
  ];

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    let filtered = articles;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(article =>
        article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
  }, [articles, selectedCategory, searchQuery]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const articlesRef = collection(db, 'articles');
      const q = query(
        articlesRef,
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const data: Article[] = [];
      
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Article);
      });
      
      setArticles(data);
      setFilteredArticles(data);
    } catch (error) {
      console.error('Error fetching articles:', error);
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
              News & Article
            </h1>

            <div className="w-20" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 border-gray-300 focus:border-[#D4AF37] focus:ring-[#D4AF37] rounded-xl"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#C5A572] text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-[#D4AF37]'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Articles */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
            <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Tidak ada artikel yang ditemukan' 
                : 'Belum ada artikel tersedia'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100 group cursor-pointer"
              >
                {/* Image */}
                {article.imageUrl ? (
                  <div className="h-48 overflow-hidden bg-gray-100">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-[#D4AF37]/20 to-[#C5A572]/20 flex items-center justify-center">
                    <Newspaper className="w-16 h-16 text-[#D4AF37] opacity-50" />
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Category & Date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D4AF37]/10 rounded-full">
                      <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span className="text-xs font-medium text-[#D4AF37]">
                        {article.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{article.views || 0}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-800 group-hover:text-[#D4AF37] transition-colors mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {article.excerpt || article.content?.substring(0, 150) + '...'}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {article.author || 'Admin'}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {article.publishedAt || article.createdAt
                          ? new Date(
                              (article.publishedAt || article.createdAt).seconds * 1000
                            ).toLocaleDateString('id-ID', { 
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : '-'}
                      </span>
                    </div>
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

export default AlumniNewsPage;
