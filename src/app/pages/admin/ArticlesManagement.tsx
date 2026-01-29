import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, Eye, CheckCircle, XCircle, Clock, Filter, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Article } from '../../../types';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface ArticlesManagementProps {
  onCreateArticle: () => void;
  onEditArticle: (articleId: string) => void;
}

const ArticlesManagement: React.FC<ArticlesManagementProps> = ({ onCreateArticle, onEditArticle }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<Article['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const articlesRef = collection(db, 'articles');
      const q = query(articlesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const articlesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Article[];
      setArticles(articlesData);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Gagal memuat artikel');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (articleId: string) => {
    try {
      await updateDoc(doc(db, 'articles', articleId), {
        status: 'published',
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Artikel berhasil dipublikasikan');
      fetchArticles();
    } catch (error) {
      console.error('Error approving article:', error);
      toast.error('Gagal mempublikasikan artikel');
    }
  };

  const handleReject = async (articleId: string) => {
    const reason = prompt('Alasan penolakan:');
    if (!reason) return;

    try {
      await updateDoc(doc(db, 'articles', articleId), {
        status: 'rejected',
        rejectedReason: reason,
        updatedAt: new Date().toISOString()
      });
      toast.success('Artikel ditolak');
      fetchArticles();
    } catch (error) {
      console.error('Error rejecting article:', error);
      toast.error('Gagal menolak artikel');
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return;

    try {
      await deleteDoc(doc(db, 'articles', articleId));
      toast.success('Artikel berhasil dihapus');
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Gagal menghapus artikel');
    }
  };

  const toggleFeatured = async (articleId: string, currentFeatured: boolean) => {
    try {
      await updateDoc(doc(db, 'articles', articleId), {
        featured: !currentFeatured,
        updatedAt: new Date().toISOString()
      });
      toast.success(currentFeatured ? 'Dihapus dari pilihan' : 'Ditandai sebagai pilihan');
      fetchArticles();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast.error('Gagal mengupdate artikel');
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesStatus = filterStatus === 'all' || article.status === filterStatus;
    const matchesSearch = searchQuery.trim() === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: Article['status']) => {
    const badges = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Edit },
      pending: { label: 'Menunggu Review', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      published: { label: 'Published', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700', icon: XCircle }
    };
    return badges[status];
  };

  const stats = {
    total: articles.length,
    pending: articles.filter(a => a.status === 'pending').length,
    published: articles.filter(a => a.status === 'published').length,
    rejected: articles.filter(a => a.status === 'rejected').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Artikel</h1>
          <p className="text-gray-600 mt-1">Kelola artikel dan cerita jamaah</p>
        </div>
        <Button
          onClick={onCreateArticle}
          className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white gap-2"
        >
          <Plus className="w-5 h-5" />
          Buat Artikel Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Artikel</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <BookOpen className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Menunggu Review</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Published</p>
              <p className="text-3xl font-bold text-green-600">{stats.published}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ditolak</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari artikel atau penulis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Semua' },
              { value: 'pending', label: 'Pending' },
              { value: 'published', label: 'Published' },
              { value: 'rejected', label: 'Ditolak' }
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value as Article['status'] | 'all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === filter.value
                    ? 'bg-gold text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
            <p className="mt-4 text-gray-600">Memuat artikel...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada artikel ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Artikel</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Penulis</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Kategori</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stats</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredArticles.map((article, index) => {
                  const statusBadge = getStatusBadge(article.status);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <motion.tr
                      key={article.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={article.thumbnail}
                            alt={article.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{article.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">{article.excerpt}</p>
                            {article.featured && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-gold/20 text-gold text-xs rounded-full">
                                ⭐ Pilihan
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{article.author.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{article.author.role}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 capitalize">{article.category.replace('-', ' ')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color} flex items-center gap-1 w-fit`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>👁️ {article.viewCount || 0} views</p>
                          <p>❤️ {article.likes || 0} likes</p>
                          <p>💬 {article.comments?.length || 0} comments</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {article.status === 'pending' && (
                            <>
                              <Button
                                onClick={() => handleApprove(article.id)}
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 text-white gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Publish
                              </Button>
                              <Button
                                onClick={() => handleReject(article.id)}
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-500 hover:bg-red-50 gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                Tolak
                              </Button>
                            </>
                          )}
                          
                          {article.status === 'published' && (
                            <Button
                              onClick={() => toggleFeatured(article.id, article.featured || false)}
                              size="sm"
                              variant="outline"
                              className="border-gold text-gold hover:bg-gold/10"
                            >
                              {article.featured ? '✗ Hapus Pilihan' : '⭐ Tandai Pilihan'}
                            </Button>
                          )}

                          <Button
                            onClick={() => onEditArticle(article.id)}
                            size="sm"
                            variant="outline"
                            className="gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          
                          <Button
                            onClick={() => handleDelete(article.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesManagement;
