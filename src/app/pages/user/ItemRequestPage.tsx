import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Plus, Package, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../../contexts/AuthContext';
import { ItemRequest, AvailableItem } from '../../../types';
import { collection, query, where, getDocs, addDoc, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface ItemRequestPageProps {
  onBack: () => void;
}

const ItemRequestPage: React.FC<ItemRequestPageProps> = ({ onBack }) => {
  const { currentUser } = useAuth();
  const [myRequests, setMyRequests] = useState<ItemRequest[]>([]);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Form state
  const [selectedItemType, setSelectedItemType] = useState<ItemRequest['itemType']>('tas');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [customization, setCustomization] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const itemTypes = [
    { value: 'tas', label: 'Tas', icon: '🎒' },
    { value: 'sajadah', label: 'Sajadah', icon: '🕌' },
    { value: 'buku-doa', label: 'Buku Doa', icon: '📖' },
    { value: 'mukena', label: 'Mukena', icon: '🧕' },
    { value: 'perlengkapan-lain', label: 'Perlengkapan Lain', icon: '🎁' },
    { value: 'custom', label: 'Custom / Lainnya', icon: '✨' },
  ];

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Fetch user's requests
      const requestsRef = collection(db, 'itemRequests');
      const q = query(
        requestsRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ItemRequest[];
      setMyRequests(requestsData);

      // Fetch available items
      const itemsRef = collection(db, 'availableItems');
      const itemsSnapshot = await getDocs(itemsRef);
      const itemsData = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AvailableItem[];
      setAvailableItems(itemsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!itemName.trim()) {
      toast.error('Nama barang tidak boleh kosong');
      return;
    }

    try {
      setSubmitting(true);

      const newRequest: Omit<ItemRequest, 'id'> = {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'User',
        userEmail: currentUser.email || '',
        itemType: selectedItemType,
        itemName: itemName.trim(),
        quantity: quantity,
        description: description.trim() || undefined,
        customization: customization.trim() || undefined,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'itemRequests'), newRequest);
      
      toast.success('Permintaan barang berhasil dikirim!');
      
      // Reset form
      setShowRequestForm(false);
      setSelectedItemType('tas');
      setItemName('');
      setQuantity(1);
      setDescription('');
      setCustomization('');
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Gagal mengirim permintaan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus permintaan ini?')) return;

    try {
      await deleteDoc(doc(db, 'itemRequests', requestId));
      toast.success('Permintaan berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Gagal menghapus permintaan');
    }
  };

  const getStatusBadge = (status: ItemRequest['status']) => {
    const badges = {
      pending: { label: 'Menunggu', icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      approved: { label: 'Disetujui', icon: CheckCircle, color: 'bg-green-100 text-green-700 border-green-200' },
      rejected: { label: 'Ditolak', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
      fulfilled: { label: 'Selesai', icon: CheckCircle, color: 'bg-blue-100 text-blue-700 border-blue-200' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] text-white py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-white hover:bg-white/20 gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-6">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Permintaan Barang
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Ajukan permintaan barang tambahan yang Anda butuhkan untuk perjalanan
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Available Items Section */}
        {availableItems.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Barang yang Tersedia</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {availableItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="font-bold text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${item.inStock ? 'text-green-600' : 'text-red-600'}`}>
                      {item.inStock ? '✓ Tersedia' : '✗ Habis'}
                    </span>
                    {item.price && (
                      <span className="text-sm font-bold text-gold">
                        Rp {item.price.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Request Form Toggle */}
        {!showRequestForm && (
          <div className="mb-12">
            <Button
              onClick={() => setShowRequestForm(true)}
              className="w-full md:w-auto bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white gap-2 px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
            >
              <Plus className="w-6 h-6" />
              Ajukan Permintaan Barang
            </Button>
          </div>
        )}

        {/* Request Form */}
        {showRequestForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Form Permintaan Barang</h2>
            <form onSubmit={handleSubmitRequest} className="space-y-6">
              {/* Item Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Jenis Barang <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {itemTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setSelectedItemType(type.value as ItemRequest['itemType'])}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedItemType === type.value
                          ? 'border-gold bg-gold/5'
                          : 'border-gray-200 hover:border-gold/50'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{type.icon}</span>
                      <span className="text-sm font-medium text-gray-900">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Barang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Contoh: Tas Koper Ukuran Besar"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                  required
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jumlah <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi / Spesifikasi (Opsional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan spesifikasi atau detail barang yang Anda butuhkan..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                />
              </div>

              {/* Customization */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Permintaan Khusus (Opsional)
                </label>
                <textarea
                  value={customization}
                  onChange={(e) => setCustomization(e.target.value)}
                  placeholder="Ada permintaan khusus? Misalnya warna, ukuran, brand tertentu..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold focus:border-transparent resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white py-3 rounded-xl"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Permintaan'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  variant="outline"
                  className="px-6 py-3 rounded-xl"
                >
                  Batal
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* My Requests */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Permintaan Saya ({myRequests.length})
          </h2>

          {myRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Permintaan</h3>
              <p className="text-gray-600 mb-6">
                Anda belum mengajukan permintaan barang. Klik tombol di atas untuk memulai!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((request, index) => {
                const statusBadge = getStatusBadge(request.status);
                const StatusIcon = statusBadge.icon;

                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gold via-gold-light to-gold-dark rounded-lg flex items-center justify-center text-2xl">
                            {itemTypes.find(t => t.value === request.itemType)?.icon || '📦'}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{request.itemName}</h3>
                            <p className="text-sm text-gray-600">
                              Jumlah: {request.quantity} • {itemTypes.find(t => t.value === request.itemType)?.label}
                            </p>
                          </div>
                        </div>

                        {request.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Deskripsi:</span> {request.description}
                          </p>
                        )}

                        {request.customization && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Permintaan Khusus:</span> {request.customization}
                          </p>
                        )}

                        {request.adminNotes && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-900">
                              <span className="font-medium">Catatan Admin:</span> {request.adminNotes}
                            </p>
                          </div>
                        )}

                        {request.rejectedReason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-900">
                              <span className="font-medium">Alasan Ditolak:</span> {request.rejectedReason}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <span className={`px-4 py-2 rounded-full text-xs font-bold border-2 ${statusBadge.color} flex items-center gap-2`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusBadge.label}
                        </span>

                        <p className="text-xs text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>

                        {request.status === 'pending' && (
                          <Button
                            onClick={() => handleDeleteRequest(request.id)}
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Hapus
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemRequestPage;
