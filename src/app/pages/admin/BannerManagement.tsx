import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Edit, Trash2, Eye, EyeOff, MoveUp, MoveDown, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Banner, Announcement } from '../../../types';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion } from 'motion/react';
import { toast } from 'sonner';

const BannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Banner form state
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerOrder, setBannerOrder] = useState(1);

  // Announcement form state
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementType, setAnnouncementType] = useState<Announcement['type']>('info');
  const [announcementLocation, setAnnouncementLocation] = useState<Announcement['displayLocation']>('all');
  const [announcementValidFrom, setAnnouncementValidFrom] = useState('');
  const [announcementValidUntil, setAnnouncementValidUntil] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch banners
      const bannersRef = collection(db, 'banners');
      const bannersQ = query(bannersRef, orderBy('order', 'asc'));
      const bannersSnapshot = await getDocs(bannersQ);
      const bannersData = bannersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Banner[];
      setBanners(bannersData);

      // Fetch announcements
      const announcementsRef = collection(db, 'announcements');
      const announcementsQ = query(announcementsRef, orderBy('createdAt', 'desc'));
      const announcementsSnapshot = await getDocs(announcementsQ);
      const announcementsData = announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bannerTitle.trim() || !bannerImage) {
      toast.error('Judul dan gambar banner wajib diisi');
      return;
    }

    try {
      const bannerData: Omit<Banner, 'id'> = {
        title: bannerTitle.trim(),
        image: bannerImage,
        link: bannerLink.trim() || undefined,
        order: bannerOrder,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingBanner) {
        await updateDoc(doc(db, 'banners', editingBanner.id), {
          ...bannerData,
          createdAt: editingBanner.createdAt
        });
        toast.success('Banner berhasil diupdate');
      } else {
        await addDoc(collection(db, 'banners'), bannerData);
        toast.success('Banner berhasil ditambahkan');
      }

      resetBannerForm();
      fetchData();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Gagal menyimpan banner');
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast.error('Judul dan konten pengumuman wajib diisi');
      return;
    }

    try {
      const announcementData: Omit<Announcement, 'id'> = {
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        type: announcementType,
        active: true,
        displayLocation: announcementLocation,
        validFrom: announcementValidFrom || undefined,
        validUntil: announcementValidUntil || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingAnnouncement) {
        await updateDoc(doc(db, 'announcements', editingAnnouncement.id), {
          ...announcementData,
          createdAt: editingAnnouncement.createdAt
        });
        toast.success('Pengumuman berhasil diupdate');
      } else {
        await addDoc(collection(db, 'announcements'), announcementData);
        toast.success('Pengumuman berhasil ditambahkan');
      }

      resetAnnouncementForm();
      fetchData();
    } catch (error) {
      console.error('Error saving announcement:', error);
      toast.error('Gagal menyimpan pengumuman');
    }
  };

  const toggleBannerActive = async (bannerId: string, currentActive: boolean) => {
    try {
      await updateDoc(doc(db, 'banners', bannerId), {
        active: !currentActive,
        updatedAt: new Date().toISOString()
      });
      toast.success(currentActive ? 'Banner dinonaktifkan' : 'Banner diaktifkan');
      fetchData();
    } catch (error) {
      console.error('Error toggling banner:', error);
      toast.error('Gagal mengupdate banner');
    }
  };

  const toggleAnnouncementActive = async (announcementId: string, currentActive: boolean) => {
    try {
      await updateDoc(doc(db, 'announcements', announcementId), {
        active: !currentActive,
        updatedAt: new Date().toISOString()
      });
      toast.success(currentActive ? 'Pengumuman dinonaktifkan' : 'Pengumuman diaktifkan');
      fetchData();
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast.error('Gagal mengupdate pengumuman');
    }
  };

  const deleteBanner = async (bannerId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus banner ini?')) return;

    try {
      await deleteDoc(doc(db, 'banners', bannerId));
      toast.success('Banner berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Gagal menghapus banner');
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;

    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
      toast.success('Pengumuman berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Gagal menghapus pengumuman');
    }
  };

  const editBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerTitle(banner.title);
    setBannerImage(banner.image);
    setBannerLink(banner.link || '');
    setBannerOrder(banner.order);
    setShowBannerForm(true);
  };

  const editAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementTitle(announcement.title);
    setAnnouncementContent(announcement.content);
    setAnnouncementType(announcement.type);
    setAnnouncementLocation(announcement.displayLocation);
    setAnnouncementValidFrom(announcement.validFrom || '');
    setAnnouncementValidUntil(announcement.validUntil || '');
    setShowAnnouncementForm(true);
  };

  const resetBannerForm = () => {
    setShowBannerForm(false);
    setEditingBanner(null);
    setBannerTitle('');
    setBannerImage('');
    setBannerLink('');
    setBannerOrder(banners.length + 1);
  };

  const resetAnnouncementForm = () => {
    setShowAnnouncementForm(false);
    setEditingAnnouncement(null);
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setAnnouncementType('info');
    setAnnouncementLocation('all');
    setAnnouncementValidFrom('');
    setAnnouncementValidUntil('');
  };

  const getAnnouncementTypeIcon = (type: Announcement['type']) => {
    const icons = {
      info: { icon: Info, color: 'text-blue-500' },
      warning: { icon: AlertTriangle, color: 'text-yellow-500' },
      success: { icon: CheckCircle, color: 'text-green-500' },
      urgent: { icon: AlertCircle, color: 'text-red-500' }
    };
    return icons[type];
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        <p className="mt-4 text-gray-600">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* BANNERS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Banner Management</h2>
            <p className="text-gray-600 mt-1">Kelola banner yang ditampilkan di halaman utama</p>
          </div>
          <Button
            onClick={() => setShowBannerForm(true)}
            className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white gap-2"
          >
            <Plus className="w-5 h-5" />
            Tambah Banner
          </Button>
        </div>

        {/* Banner Form */}
        {showBannerForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingBanner ? 'Edit Banner' : 'Tambah Banner Baru'}
            </h3>
            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Judul Banner <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Contoh: Promo Spesial Ramadhan"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gambar Banner <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
                {bannerImage && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <img
                      src={bannerImage}
                      alt="Preview"
                      className="w-full max-w-2xl h-48 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Link (Opsional)
                </label>
                <input
                  type="text"
                  value={bannerLink}
                  onChange={(e) => setBannerLink(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Urutan Tampil
                </label>
                <input
                  type="number"
                  min="1"
                  value={bannerOrder}
                  onChange={(e) => setBannerOrder(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-gold hover:bg-gold-dark text-white">
                  {editingBanner ? 'Update Banner' : 'Simpan Banner'}
                </Button>
                <Button type="button" onClick={resetBannerForm} variant="outline">
                  Batal
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Banners List */}
        <div className="grid md:grid-cols-2 gap-6">
          {banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100"
            >
              <div className="relative h-48">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full">
                    Order: {banner.order}
                  </span>
                  <span className={`px-3 py-1 backdrop-blur-sm text-white text-xs rounded-full ${
                    banner.active ? 'bg-green-500' : 'bg-gray-500'
                  }`}>
                    {banner.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2">{banner.title}</h3>
                {banner.link && (
                  <p className="text-sm text-gray-600 mb-3 truncate">Link: {banner.link}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={() => toggleBannerActive(banner.id, banner.active)}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    {banner.active ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                    {banner.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                  <Button
                    onClick={() => editBanner(banner)}
                    size="sm"
                    variant="outline"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteBanner(banner.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {banners.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada banner. Klik tombol di atas untuk menambahkan!</p>
          </div>
        )}
      </div>

      {/* ANNOUNCEMENTS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pengumuman</h2>
            <p className="text-gray-600 mt-1">Kelola pengumuman penting untuk jamaah</p>
          </div>
          <Button
            onClick={() => setShowAnnouncementForm(true)}
            className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white gap-2"
          >
            <Plus className="w-5 h-5" />
            Tambah Pengumuman
          </Button>
        </div>

        {/* Announcement Form */}
        {showAnnouncementForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingAnnouncement ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
            </h3>
            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Judul <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Konten <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipe
                  </label>
                  <select
                    value={announcementType}
                    onChange={(e) => setAnnouncementType(e.target.value as Announcement['type'])}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lokasi Tampil
                  </label>
                  <select
                    value={announcementLocation}
                    onChange={(e) => setAnnouncementLocation(e.target.value as Announcement['displayLocation'])}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                  >
                    <option value="all">Semua Halaman</option>
                    <option value="home">Halaman Utama</option>
                    <option value="dashboard">Dashboard Saja</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-gold hover:bg-gold-dark text-white">
                  {editingAnnouncement ? 'Update Pengumuman' : 'Simpan Pengumuman'}
                </Button>
                <Button type="button" onClick={resetAnnouncementForm} variant="outline">
                  Batal
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.map((announcement, index) => {
            const typeInfo = getAnnouncementTypeIcon(announcement.type);
            const TypeIcon = typeInfo.icon;

            return (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <TypeIcon className={`w-6 h-6 ${typeInfo.color}`} />
                      <h3 className="font-bold text-gray-900">{announcement.title}</h3>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        announcement.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {announcement.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{announcement.content}</p>
                    <p className="text-xs text-gray-500">
                      Ditampilkan di: {announcement.displayLocation === 'all' ? 'Semua Halaman' : announcement.displayLocation === 'home' ? 'Halaman Utama' : 'Dashboard'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleAnnouncementActive(announcement.id, announcement.active)}
                      size="sm"
                      variant="outline"
                    >
                      {announcement.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => editAnnouncement(announcement)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteAnnouncement(announcement.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {announcements.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada pengumuman. Klik tombol di atas untuk menambahkan!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerManagement;
