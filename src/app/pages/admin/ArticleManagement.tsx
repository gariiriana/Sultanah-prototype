import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  Phone,
  AtSign,
  Calendar,
  Newspaper,
  FileText,
  Search,
  Edit,
  Trash2,
  Save,
  Plus,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { collection, getDocs, doc, updateDoc, Timestamp, query, orderBy, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { compressToTargetSize } from '../../../utils/imageCompression';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';

interface Article {
  id: string;
  author: {
    id: string;
    name: string;
    email: string;
    phone: string;
    socialMedia: string;
    role: string;
  };
  title: string;
  content: string;
  category: 'news' | 'article';
  image: string;
  imageName: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Timestamp | null;
  rejectionReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp | null;
  views?: number;
  likes?: number;
}

const ArticleManagement = () => {
  const { userProfile, currentUser } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    category: 'article' as 'news' | 'article'
  });

  // Create form state
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    category: 'article' as 'news' | 'article',
    image: '',
    imageName: ''
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'articles'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const articlesData = await Promise.all(querySnapshot.docs.map(async d => {
        const data = d.data();
        let imageUrl = data.image; // Legacy

        // Fetch from separate collection if imageId exists
        if (data.imageId) {
          try {
            const imageSnap = await getDoc(doc(db, 'article_files', data.imageId));
            if (imageSnap.exists()) {
              imageUrl = imageSnap.data().content;
            }
          } catch (err) {
            console.error('Failed to load image for article', d.id);
          }
        }

        return {
          id: d.id,
          ...data,
          image: imageUrl
        };
      })) as Article[];

      setArticles(articlesData);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (articleId: string) => {
    if (!userProfile?.email) return;

    setActionLoading(true);
    try {
      const articleRef = doc(db, 'articles', articleId);
      await updateDoc(articleRef, {
        status: 'approved',
        reviewedBy: userProfile.email,
        reviewedAt: Timestamp.now(),
        publishedAt: Timestamp.now(),
        rejectionReason: ''
      });

      toast.success('Article approved successfully!');
      fetchArticles();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error approving article:', error);
      toast.error('Failed to approve article');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedArticle || !userProfile?.email) return;

    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const articleRef = doc(db, 'articles', selectedArticle.id);
      await updateDoc(articleRef, {
        status: 'rejected',
        reviewedBy: userProfile.email,
        reviewedAt: Timestamp.now(),
        rejectionReason: rejectionReason
      });

      toast.success('Article rejected');
      fetchArticles();
      setShowRejectModal(false);
      setShowDetailModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting article:', error);
      toast.error('Failed to reject article');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (article: Article) => {
    setSelectedArticle(article);
    setEditForm({
      title: article.title,
      content: article.content,
      category: article.category
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedArticle || !userProfile?.email) return;

    if (!editForm.title.trim()) {
      toast.error('Judul artikel tidak boleh kosong');
      return;
    }

    if (!editForm.content.trim()) {
      toast.error('Konten artikel tidak boleh kosong');
      return;
    }

    setActionLoading(true);
    try {
      const articleRef = doc(db, 'articles', selectedArticle.id);
      await updateDoc(articleRef, {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        category: editForm.category,
        updatedAt: Timestamp.now(),
        lastEditedBy: userProfile.email
      });

      toast.success('✅ Artikel berhasil diupdate!');
      fetchArticles();
      setShowEditModal(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error('❌ Gagal mengupdate artikel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedArticle) return;

    setActionLoading(true);
    try {
      const articleRef = doc(db, 'articles', selectedArticle.id);
      await updateDoc(articleRef, {
        deleted: true,
        deletedAt: Timestamp.now(),
        deletedBy: userProfile?.email || 'admin'
      });

      toast.success('✅ Artikel berhasil dihapus!');
      fetchArticles();
      setShowDeleteConfirm(false);
      setSelectedArticle(null);
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('❌ Gagal menghapus artikel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG or PNG.');
      return;
    }

    // Validate file size (max 5MB - will be compressed)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const rawBase64 = reader.result as string;

        // Compress if larger than 1MB (approx)
        let finalImage = rawBase64;
        if (file.size > 1024 * 1024) {
          toast.info('Mengompres gambar agar muat di database...', { duration: 3000 });
          // Compress to < 900KB to be safe for 1MB limit
          finalImage = await compressToTargetSize(rawBase64, 900 * 1024);
        }

        setCreateForm({
          ...createForm,
          image: finalImage,
          imageName: file.name
        });
        toast.success(`Gambar berhasil diupload! (${(finalImage.length / 1024).toFixed(0)} KB)`);
      } catch (error) {
        console.error('Compression error:', error);
        toast.error('Gagal memproses gambar');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateArticle = async () => {
    console.log('=== DEBUG: Starting handleCreateArticle ===');
    console.log('userProfile:', userProfile);
    console.log('currentUser:', currentUser);

    // ✅ Get user ID and email with proper fallback
    const userId = userProfile?.uid || userProfile?.id || currentUser?.uid;
    const userEmail = userProfile?.email || currentUser?.email;

    console.log('userId:', userId);
    console.log('userEmail:', userEmail);

    if (!userId || !userEmail) {
      console.error('❌ Auth error - Missing userId or userEmail');
      console.error('userProfile:', JSON.stringify(userProfile, null, 2));
      console.error('currentUser:', currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      } : null);
      toast.error('User authentication error. Please refresh and try again.');
      return;
    }

    // Validation
    if (!createForm.title.trim()) {
      toast.error('Judul artikel tidak boleh kosong');
      return;
    }

    if (!createForm.content.trim()) {
      toast.error('Konten artikel tidak boleh kosong');
      return;
    }

    if (!createForm.image) {
      toast.error('Silakan upload gambar artikel');
      return;
    }

    setActionLoading(true);
    try {
      // ✅ Build author object with proper fallbacks
      const authorName = (userProfile as any)?.name ||
        (userProfile as any)?.displayName ||
        userProfile?.identityInfo?.fullName ||
        currentUser?.displayName ||
        userEmail.split('@')[0] || // Use email username as fallback
        'Admin';

      const authorPhone = (userProfile as any)?.phone ||
        (userProfile as any)?.phoneNumber ||
        currentUser?.phoneNumber ||
        '-';

      console.log('authorName:', authorName);
      console.log('authorPhone:', authorPhone);





      // ✅ 1. Upload image to separate collection 'article_files' first
      let imageId = '';
      if (createForm.image && createForm.image.startsWith('data:')) {
        console.log('📤 Uploading image to separate collection...');
        try {
          const fileDoc = await addDoc(collection(db, 'article_files'), {
            name: createForm.imageName,
            content: createForm.image,
            type: 'article_image',
            createdAt: Timestamp.now()
          });
          imageId = fileDoc.id;
          console.log('✅ Image saved with ID:', imageId);
        } catch (uploadError) {
          console.error('Failed to upload image to separate collection:', uploadError);
          throw new Error('Gagal menyimpan gambar ke database (File error)');
        }
      }

      const articleData = {
        author: {
          id: userId,
          name: authorName,
          email: userEmail,
          phone: authorPhone,
          socialMedia: '-',
          role: userProfile?.role || 'admin'
        },
        title: createForm.title.trim(),
        content: createForm.content.trim(),
        category: createForm.category,

        // ✅ Store Image ID & Name
        imageId: imageId,
        imageName: createForm.imageName,

        // ❌ REMOVE Base64 from main doc
        image: null,

        status: 'approved', // Admin articles are auto-approved
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        publishedAt: Timestamp.now(),
        reviewedBy: userEmail,
        reviewedAt: Timestamp.now(),
        views: 0,
        likes: 0
      };

      // Remove nulls
      delete (articleData as any).image;

      console.log('✅ Article data prepared:', JSON.stringify(articleData, null, 2));
      console.log('📝 Attempting to save to Firestore...');

      const docRef = await addDoc(collection(db, 'articles'), articleData);
      console.log('✅ Article created successfully with ID:', docRef.id);

      toast.success('✅ Artikel berhasil dibuat dan dipublikasikan!');
      fetchArticles();
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        content: '',
        category: 'article',
        image: '',
        imageName: ''
      });
    } catch (error: any) {
      console.error('❌ Error creating article:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));

      // Better error messages based on error type
      if (error.code === 'permission-denied') {
        toast.error('❌ Permission Denied!', {
          duration: 10000,
          description: '🔥 Firestore Rules belum di-deploy! Lihat file DEPLOY_FIRESTORE_RULES_ARTICLES_FIX.md untuk cara deploy.'
        });
      } else if (error.code === 'unauthenticated') {
        toast.error('❌ Not authenticated. Please login again.');
      } else {
        toast.error(`❌ Gagal membuat artikel: ${error.message}`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter articles
  const filteredArticles = articles.filter(article => {
    // Don't show deleted articles
    if ((article as any).deleted === true) return false;

    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;

    // Defensive programming: Handle missing fields
    const title = article.title || '';
    const authorName = article.author?.name || '';
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch = title.toLowerCase().includes(searchLower) ||
      authorName.toLowerCase().includes(searchLower);
    return matchesStatus && matchesSearch;
  });

  // Debug: Log if articles are being filtered out unexpectedly
  useEffect(() => {
    if (articles.length > 0 && filteredArticles.length === 0) {
      console.log('🔍 DEBUG: Articles exist but filtered out');
      console.log('Total articles:', articles.length);
      console.log('Status filter:', statusFilter);
      console.log('Search query:', searchQuery);
      console.log('Articles data:', articles.map(a => ({
        id: a.id,
        title: a.title,
        status: a.status,
        hasAuthor: !!a.author,
        authorName: a.author?.name,
        deleted: (a as any).deleted
      })));
    }
  }, [articles, filteredArticles, statusFilter, searchQuery]);

  // ✅ FIX: Filter out deleted articles when calculating stats
  const activeArticles = articles.filter(a => (a as any).deleted !== true);

  const stats = {
    total: activeArticles.length,
    pending: activeArticles.filter(a => a.status === 'pending').length,
    approved: activeArticles.filter(a => a.status === 'approved').length,
    rejected: activeArticles.filter(a => a.status === 'rejected').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Management</h2>
          <p className="text-gray-600">Review and manage article submissions from jamaah</p>
        </div>
        <Button
          onClick={() => {
            setCreateForm({
              title: '',
              content: '',
              category: 'article',
              image: '',
              imageName: ''
            });
            setShowCreateModal(true);
          }}
          className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] hover:from-[#C5A572] hover:to-[#D4AF37] text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Buat Artikel Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Articles</p>
                <p className="text-3xl font-bold text-blue-700 mt-1">{stats.total}</p>
              </div>
              <Newspaper className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-700 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{stats.approved}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-700 mt-1">{stats.rejected}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                size="sm"
                className={statusFilter === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('approved')}
                size="sm"
                className={statusFilter === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('rejected')}
                size="sm"
                className={statusFilter === 'rejected' ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
          <p className="mt-4 text-gray-600">Loading articles...</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Newspaper className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Articles Found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No articles have been submitted yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Article Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>

                    {/* Article Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {article.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(article.status)}`}>
                              {article.status.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {article.category === 'news' ? 'Berita' : 'Artikel'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {article.content}
                          </p>
                        </div>
                        {getStatusIcon(article.status)}
                      </div>

                      {/* Author Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{article.author.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{article.author.phone}</span>
                        </div>
                        {article.author.socialMedia && (
                          <div className="flex items-center gap-2 text-sm">
                            <AtSign className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 truncate">{article.author.socialMedia}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{formatDate(article.createdAt)}</span>
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {article.status === 'rejected' && article.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                          <p className="text-sm font-semibold text-red-900 mb-1">Rejection Reason:</p>
                          <p className="text-sm text-red-700">{article.rejectionReason}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedArticle(article);
                            setShowDetailModal(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>

                        {article.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => handleApprove(article.id)}
                              disabled={actionLoading}
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedArticle(article);
                                setShowRejectModal(true);
                              }}
                              disabled={actionLoading}
                              size="sm"
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}

                        {/* EDIT BUTTON - Available for ALL articles */}
                        <Button
                          onClick={() => handleEdit(article)}
                          disabled={actionLoading}
                          size="sm"
                          variant="outline"
                          className="border-blue-500 text-blue-500 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>

                        {/* DELETE BUTTON - Available for ALL articles */}
                        <Button
                          onClick={() => {
                            setSelectedArticle(article);
                            setShowDeleteConfirm(true);
                          }}
                          disabled={actionLoading}
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-[#C5A572] to-[#D4AF37] p-6 text-white">
                <h2 className="text-2xl font-bold mb-1">Article Details</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedArticle.status)}`}>
                    {selectedArticle.status.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 bg-white/20 rounded text-xs">
                    {selectedArticle.category === 'news' ? 'Berita' : 'Artikel'}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Article Image */}
                <div>
                  <img
                    src={selectedArticle.image}
                    alt={selectedArticle.title}
                    className="w-full h-auto rounded-lg"
                  />
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedArticle.title}</h3>
                </div>

                {/* Author Info */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Author Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{selectedArticle.author.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{selectedArticle.author.phone}</p>
                    </div>
                    {selectedArticle.author.socialMedia && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Social Media</p>
                        <p className="font-medium text-gray-900">{selectedArticle.author.socialMedia}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Content</h4>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedArticle.content}</p>
                  </div>
                </div>

                {/* Submission Info */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Submission Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Submitted By</p>
                      <p className="font-medium text-gray-900">{selectedArticle.author.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="font-medium text-gray-900">{selectedArticle.author.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Submitted At</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedArticle.createdAt)}</p>
                    </div>
                    {selectedArticle.reviewedAt && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">Reviewed At</p>
                          <p className="font-medium text-gray-900">{formatDate(selectedArticle.reviewedAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Reviewed By</p>
                          <p className="font-medium text-gray-900">{selectedArticle.reviewedBy}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t pt-4">
                  <Button
                    onClick={() => setShowDetailModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                  {selectedArticle.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleApprove(selectedArticle.id)}
                        disabled={actionLoading}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading}
                        className="flex-1"
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Article</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting this article:
              </p>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                  variant="destructive"
                  className="flex-1"
                >
                  Reject Article
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  <Edit className="w-6 h-6" />
                  Edit Artikel
                </h2>
                <p className="text-blue-100">Ubah konten artikel yang sudah disubmit oleh user</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Preview Image */}
                {selectedArticle.image && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preview Gambar
                    </label>
                    <img
                      src={selectedArticle.image}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Artikel <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Masukkan judul artikel..."
                    className="w-full"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, category: 'article' })}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${editForm.category === 'article'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <FileText className="w-5 h-5 mx-auto mb-1" />
                      <p className="font-medium">Artikel</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, category: 'news' })}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${editForm.category === 'news'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Newspaper className="w-5 h-5 mx-auto mb-1" />
                      <p className="font-medium">Berita</p>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konten Artikel <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    placeholder="Masukkan konten artikel..."
                    rows={10}
                    className="w-full"
                  />
                </div>

                {/* Author Info (Read Only) */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Informasi Penulis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nama</p>
                      <p className="font-medium text-gray-900">{selectedArticle.author.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="font-medium text-gray-900">{selectedArticle.author.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedArticle.author.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Telepon</p>
                      <p className="font-medium text-gray-900">{selectedArticle.author.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t pt-4">
                  <Button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedArticle(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={actionLoading || !editForm.title.trim() || !editForm.content.trim()}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Artikel?</h3>
                  <p className="text-gray-600">
                    Apakah Anda yakin ingin menghapus artikel ini? Artikel akan ditandai sebagai deleted dan tidak akan tampil lagi.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <img
                    src={selectedArticle.image}
                    alt={selectedArticle.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{selectedArticle.title}</p>
                    <p className="text-sm text-gray-600">
                      Oleh: {selectedArticle.author.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {selectedArticle.status.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedArticle(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {actionLoading ? 'Menghapus...' : 'Ya, Hapus'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  <Plus className="w-6 h-6" />
                  Buat Artikel Baru
                </h2>
                <p className="text-blue-100">Buat dan publikasikan artikel baru</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Upload Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Gambar <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="file"
                        accept="image/jpeg, image/png, image/jpg"
                        onChange={handleImageUpload}
                        className="pl-10"
                      />
                    </div>
                    {createForm.image && (
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600 truncate">{createForm.imageName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul Artikel <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="Masukkan judul artikel..."
                    className="w-full"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, category: 'article' })}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${createForm.category === 'article'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <FileText className="w-5 h-5 mx-auto mb-1" />
                      <p className="font-medium">Artikel</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, category: 'news' })}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${createForm.category === 'news'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Newspaper className="w-5 h-5 mx-auto mb-1" />
                      <p className="font-medium">Berita</p>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konten Artikel <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={createForm.content}
                    onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                    placeholder="Masukkan konten artikel..."
                    rows={10}
                    className="w-full"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t pt-4">
                  <Button
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateForm({
                        title: '',
                        content: '',
                        category: 'article',
                        image: '',
                        imageName: ''
                      });
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleCreateArticle}
                    disabled={actionLoading || !createForm.title.trim() || !createForm.content.trim() || !createForm.image}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {actionLoading ? 'Publishing...' : 'Publish Artikel'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArticleManagement;