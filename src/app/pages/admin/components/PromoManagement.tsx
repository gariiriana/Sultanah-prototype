import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Tag,
  Calendar,
  Percent,
  Sparkles,
  AlertCircle,
  Gift,
  Image as ImageIcon,
  List,
  FileText,
  Navigation,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '../../../../utils/imageCompression';
import { Promo } from '../../../../types';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const PromoManagement = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; promoId: string | null }>({
    isOpen: false,
    promoId: null,
  });
  const [formData, setFormData] = useState<Omit<Promo, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    discount: '',
    validUntil: '',
    color: 'gold',
    icon: 'clock',
    badge: '',
    image: '',
    // Detail page fields
    detailDescription: '',
    includes: [],
    excludes: [],
    terms: '',
    meetingPoint: '',
    whatsappNumber: '',
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'promos'));
      const promosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Promo[];
      setPromos(promosData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error fetching promos:', error);
      toast.error('Gagal memuat data promo');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.title || !formData.description || !formData.discount || !formData.validUntil) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    try {
      await addDoc(collection(db, 'promos'), {
        ...formData,
        createdAt: new Date(),
      });
      toast.success('Promo berhasil ditambahkan');
      setIsAdding(false);
      resetForm();
      fetchPromos();
    } catch (error) {
      console.error('Error adding promo:', error);
      toast.error('Gagal menambahkan promo');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.title || !formData.description || !formData.discount || !formData.validUntil) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    try {
      const promoRef = doc(db, 'promos', id);
      await updateDoc(promoRef, formData);
      toast.success('Promo berhasil diperbarui');
      setEditingId(null);
      resetForm();
      fetchPromos();
    } catch (error) {
      console.error('Error updating promo:', error);
      toast.error('Gagal memperbarui promo');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'promos', id));
      toast.success('Promo berhasil dihapus');
      fetchPromos();
    } catch (error) {
      console.error('Error deleting promo:', error);
      toast.error('Gagal menghapus promo');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, promoId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.promoId) {
      await handleDelete(deleteConfirm.promoId);
    }
  };

  const handleEdit = (promo: Promo) => {
    setEditingId(promo.id);
    setFormData({
      title: promo.title,
      description: promo.description,
      discount: promo.discount,
      validUntil: promo.validUntil,
      color: promo.color,
      icon: promo.icon,
      badge: promo.badge || '',
      image: promo.image || '',
      // Detail page fields
      detailDescription: promo.detailDescription || '',
      includes: promo.includes || [],
      excludes: promo.excludes || [],
      terms: promo.terms || '',
      meetingPoint: promo.meetingPoint || '',
      whatsappNumber: promo.whatsappNumber || '',
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discount: '',
      validUntil: '',
      color: 'gold',
      icon: 'clock',
      badge: '',
      image: '',
      // Detail page fields
      detailDescription: '',
      includes: [],
      excludes: [],
      terms: '',
      meetingPoint: '',
      whatsappNumber: '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    resetForm();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Format file tidak valid. Gunakan JPG, PNG, atau WebP');
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB');
      e.target.value = ''; // Reset input
      return;
    }

    try {
      toast.info('Mengompress gambar...');
      const base64 = await compressImage(file);
      setFormData({ ...formData, image: base64 });
      toast.success('Foto berhasil diupload!');
      e.target.value = ''; // Reset input untuk upload berikutnya
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Gagal mengupload foto. Silakan coba lagi.');
      e.target.value = ''; // Reset input
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: '' });
    toast.success('Foto berhasil dihapus');
  };

  const colorOptions = [
    { value: 'blue', label: 'Biru', bgClass: 'bg-blue-500', previewClass: 'from-blue-500 to-blue-600' },
    { value: 'gold', label: 'Gold', bgClass: 'bg-yellow-500', previewClass: 'from-yellow-400 to-yellow-500' },
    { value: 'green', label: 'Hijau', bgClass: 'bg-green-500', previewClass: 'from-green-500 to-green-600' },
  ];

  const iconOptions = [
    { value: 'clock', label: '⏰ Clock (Early Bird)', icon: '⏰' },
    { value: 'gift', label: '🎁 Gift (Special)', icon: '🎁' },
    { value: 'users', label: '👥 Users (Group)', icon: '👥' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent">
            Manajemen Promo
          </h2>
          <p className="text-gray-600 mt-1">Kelola promo menarik untuk pelanggan</p>
        </div>
        {!isAdding && !editingId && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tambah Promo
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-white to-gray-50 border-2 border-[#D4AF37]/20 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Gift className="w-6 h-6 text-[#D4AF37]" />
                {isAdding ? 'Tambah Promo Baru' : 'Edit Promo'}
              </h3>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Judul Promo *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Early Bird Promo"
                  className="border-[#D4AF37]/30 focus:border-[#D4AF37]"
                />
                <p className="text-xs text-gray-500 mt-1">Judul singkat dan menarik</p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Contoh: Diskon spesial untuk booking 3 bulan sebelumnya"
                  className="w-full px-4 py-2 border border-[#D4AF37]/30 rounded-lg focus:outline-none focus:border-[#D4AF37] min-h-[80px]"
                />
                <p className="text-xs text-gray-500 mt-1">Penjelasan detail tentang promo</p>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Percent className="w-4 h-4 inline mr-1" />
                  Diskon *
                </label>
                <Input
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  placeholder="Contoh: 15%, 20%"
                  className="border-[#D4AF37]/30 focus:border-[#D4AF37]"
                />
                <p className="text-xs text-gray-500 mt-1">Format: angka + % (contoh: 15%)</p>
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Berlaku Hingga *
                </label>
                <Input
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  placeholder="Contoh: 31 Maret 2025"
                  className="border-[#D4AF37]/30 focus:border-[#D4AF37]"
                />
                <p className="text-xs text-gray-500 mt-1">Format: DD Bulan YYYY</p>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Icon *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {iconOptions.map((iconOpt) => (
                    <button
                      key={iconOpt.value}
                      onClick={() => setFormData({ ...formData, icon: iconOpt.value as any })}
                      className={`p-3 rounded-lg border-2 transition-all ${formData.icon === iconOpt.value
                        ? 'border-[#D4AF37] shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="text-2xl mb-1">{iconOpt.icon}</div>
                      <p className="text-xs font-medium text-center truncate">{iconOpt.label.split(' ')[1]}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ✅ NEW: Color Picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🎨 Warna Kartu *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((colorOpt) => (
                    <button
                      key={colorOpt.value}
                      onClick={() => setFormData({ ...formData, color: colorOpt.value as any })}
                      className={`p-3 rounded-lg border-2 transition-all ${formData.color === colorOpt.value
                        ? 'border-[#D4AF37] shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className={`w-full h-8 rounded-md bg-gradient-to-r ${colorOpt.previewClass} mb-2`}></div>
                      <p className="text-xs font-semibold text-center">{colorOpt.label}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Pilih warna untuk background kartu promo</p>
              </div>

              {/* Badge (Optional) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Badge (Opsional)
                </label>
                <Input
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="Contoh: TERPOPULER, BEST SELLER"
                  className="border-[#D4AF37]/30 focus:border-[#D4AF37]"
                />
                <p className="text-xs text-gray-500 mt-1">Badge khusus untuk highlight promo (opsional)</p>
              </div>

              {/* Image Upload (Optional) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Foto Promo (Opsional)
                </label>

                {formData.image ? (
                  <div className="relative">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-[#D4AF37]/30"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="promo-image-upload"
                    />
                    <label
                      htmlFor="promo-image-upload"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#D4AF37]/30 rounded-lg cursor-pointer hover:border-[#D4AF37] hover:bg-gray-50 transition-all"
                    >
                      <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-600">Klik untuk upload foto</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (Max 5MB)</p>
                    </label>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Upload foto menarik untuk promo. Jika tidak ada foto, kartu akan menggunakan warna gradient.
                </p>
              </div>

              {/* DETAIL PAGE INFORMATION SECTION */}
              <div className="md:col-span-2 border-t pt-6 mt-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#D4AF37]" />
                  Informasi Detail Halaman Promo
                </h4>
                <p className="text-sm text-gray-600 mb-6">Isi detail lengkap yang akan ditampilkan di halaman detail promo</p>

                {/* Detail Description */}
                <div className="space-y-2 mb-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Deskripsi Detail (Opsional)
                  </label>
                  <Textarea
                    value={formData.detailDescription}
                    onChange={(e) => setFormData({ ...formData, detailDescription: e.target.value })}
                    placeholder="Deskripsi lengkap untuk halaman detail promo..."
                    className="border-[#D4AF37]/30 focus:border-[#D4AF37] min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500">Penjelasan lebih detail tentang promo ini</p>
                </div>

                {/* Includes */}
                <div className="space-y-2 mb-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    <List className="w-4 h-4 inline mr-1" />
                    Yang Termasuk (satu per baris, opsional)
                  </label>
                  <Textarea
                    value={Array.isArray(formData.includes) ? formData.includes.join('\n') : ''}
                    onChange={(e) => setFormData({ ...formData, includes: e.target.value.split('\n').filter(f => f.trim()) })}
                    placeholder="✅ Diskon untuk semua paket umrah&#10;✅ Berlaku untuk booking 3 bulan ke depan&#10;✅ Termasuk asuransi perjalanan"
                    className="border-[#D4AF37]/30 focus:border-[#D4AF37] min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500">Apa saja yang termasuk dalam promo ini</p>
                </div>

                {/* Excludes */}
                <div className="space-y-2 mb-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Tidak Termasuk (satu per baris, opsional)
                  </label>
                  <Textarea
                    value={Array.isArray(formData.excludes) ? formData.excludes.join('\n') : ''}
                    onChange={(e) => setFormData({ ...formData, excludes: e.target.value.split('\n').filter(f => f.trim()) })}
                    placeholder="❌ Tidak berlaku untuk tanggal merah&#10;❌ Tidak dapat digabung dengan promo lain&#10;❌ Tidak termasuk visa"
                    className="border-[#D4AF37]/30 focus:border-[#D4AF37] min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500">Apa yang tidak termasuk atau batasan promo</p>
                </div>

                {/* Meeting Point */}
                <div className="space-y-2 mb-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    <Navigation className="w-4 h-4 inline mr-1" />
                    Titik Keberangkatan (Opsional)
                  </label>
                  <Input
                    value={formData.meetingPoint}
                    onChange={(e) => setFormData({ ...formData, meetingPoint: e.target.value })}
                    placeholder="Contoh: Bandara Soekarno-Hatta, Terminal 3"
                    className="border-[#D4AF37]/30 focus:border-[#D4AF37]"
                  />
                  <p className="text-xs text-gray-500">Lokasi keberangkatan jika applicable</p>
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-2 mb-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Nomor WhatsApp untuk Konsultasi (Opsional)
                  </label>
                  <Input
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder="6281234700116"
                    className="border-[#D4AF37]/30 focus:border-[#D4AF37]"
                  />
                  <p className="text-xs text-gray-500">Format: 628XXXXXXXXXX (tanpa +, tanpa spasi)</p>
                </div>

                {/* Terms & Conditions */}
                <div className="space-y-2 mb-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Syarat & Ketentuan (Opsional)
                  </label>
                  <Textarea
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    placeholder="1. Promo berlaku untuk pemesanan periode tertentu&#10;2. Tidak dapat digabung dengan promo lain&#10;3. Syarat dan ketentuan dapat berubah sewaktu-waktu"
                    className="border-[#D4AF37]/30 focus:border-[#D4AF37] min-h-[120px]"
                  />
                  <p className="text-xs text-gray-500">Syarat dan ketentuan lengkap promo</p>
                </div>
              </div>

              {/* Preview */}
              <div className="md:col-span-2 bg-gray-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Preview Kartu Promo:
                </p>
                <div className="relative">
                  <div className={`bg-gradient-to-br ${colorOptions.find(c => c.value === formData.color)?.previewClass} rounded-2xl p-6 text-white shadow-xl`}>
                    {formData.badge && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        ✨ {formData.badge}
                      </span>
                    )}
                    <div className="text-4xl mb-2">{iconOptions.find(i => i.value === formData.icon)?.icon}</div>
                    <h4 className="text-3xl font-bold mb-2">{formData.discount || '??%'}</h4>
                    <h5 className="text-xl font-bold mb-3">{formData.title || 'Judul Promo'}</h5>
                    <p className="text-white/90 mb-4 text-sm">{formData.description || 'Deskripsi promo...'}</p>
                    <div className="text-sm">
                      <p className="text-white/80">Valid hingga</p>
                      <p className="font-semibold">{formData.validUntil || 'Tanggal'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => (isAdding ? handleAdd() : handleUpdate(editingId!))}
                className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white"
              >
                <Save className="w-5 h-5 mr-2" />
                {isAdding ? 'Simpan Promo' : 'Update Promo'}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="border-gray-300">
                <X className="w-5 h-5 mr-2" />
                Batal
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promo List */}
      {promos.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">Belum Ada Promo</h3>
          <p className="text-gray-500 mb-6">Tambahkan promo pertama Anda untuk menarik pelanggan</p>
          {!isAdding && (
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Tambah Promo Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map((promo) => {
            const colorClass = {
              blue: 'from-blue-500 to-blue-600',
              gold: 'from-yellow-400 to-yellow-500',
              green: 'from-green-500 to-green-600',
            }[promo.color || 'gold'];

            const iconEmoji = {
              clock: '⏰',
              gift: '🎁',
              users: '👥',
            }[promo.icon || 'gift'];

            return (
              <motion.div
                key={promo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group"
              >
                <div className="relative h-full">
                  {/* Promo Card */}
                  <div className={`bg-gradient-to-br ${colorClass} rounded-2xl p-6 text-white shadow-xl transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105`}>
                    {promo.badge && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                        ✨ {promo.badge}
                      </span>
                    )}

                    <div className="text-4xl mb-2">{iconEmoji}</div>
                    <h4 className="text-3xl font-bold mb-2">{promo.discount}</h4>
                    <h5 className="text-xl font-bold mb-3">{promo.title}</h5>
                    <p className="text-white/90 mb-4 text-sm line-clamp-2">{promo.description}</p>

                    <div className="text-sm mb-4">
                      <p className="text-white/80">Valid hingga</p>
                      <p className="font-semibold">{promo.validUntil}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(promo)}
                        className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(promo.id)}
                        className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, promoId: null })}
        onConfirm={confirmDelete}
        title="Hapus Promo"
        message="Apakah Anda yakin ingin menghapus promo ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
};

export default PromoManagement;