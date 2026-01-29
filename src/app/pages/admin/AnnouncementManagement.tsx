import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { Announcement, AnnouncementFormData } from '../../types/announcement';
import { useAuth } from '../../../contexts/AuthContext';

const ROLES = [
  { value: 'guest', label: 'Guest (Belum Login)' },
  { value: 'prospective-jamaah', label: 'Calon Jamaah' },
  { value: 'current-jamaah', label: 'Jamaah Umroh' },
  { value: 'alumni-jamaah', label: 'Alumni Jamaah' },
  { value: 'tour-leader', label: 'Tour Leader' },
  { value: 'muthawif', label: 'Muthawif' },
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'supervisor', label: 'Supervisor' },
];

export default function AnnouncementManagement() {
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    message: '',
    isUrgent: false,
    isActive: true,
    targetRoles: ['guest', 'prospective-jamaah', 'current-jamaah'],
  });

  // Fetch announcements
  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const announcementsData: Announcement[] = [];
      snapshot.forEach((doc) => {
        announcementsData.push({
          id: doc.id,
          ...doc.data(),
        } as Announcement);
      });
      setAnnouncements(announcementsData);
    });

    return () => unsubscribe();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const announcementData = {
        title: formData.title,
        message: formData.message,
        isUrgent: formData.isUrgent,
        isActive: formData.isActive,
        targetRoles: formData.targetRoles,
        publishDate: formData.publishDate ? Timestamp.fromDate(formData.publishDate) : Timestamp.now(),
        expiryDate: formData.expiryDate ? Timestamp.fromDate(formData.expiryDate) : null,
        updatedAt: Timestamp.now(),
      };

      if (editingAnnouncement) {
        // Update
        await updateDoc(doc(db, 'announcements', editingAnnouncement.id), {
          ...announcementData,
          updatedBy: auth.currentUser.uid,
        });
        showNotification('success', '✅ Pengumuman berhasil diupdate!');
      } else {
        // Create
        await addDoc(collection(db, 'announcements'), {
          ...announcementData,
          createdAt: Timestamp.now(),
          createdBy: auth.currentUser.uid,
          createdByName: userProfile?.displayName || 'Admin',
        });
        showNotification('success', '✅ Pengumuman berhasil dibuat!');
      }

      // Reset form
      setFormData({
        title: '',
        message: '',
        isUrgent: false,
        isActive: true,
        targetRoles: ['guest', 'prospective-jamaah', 'current-jamaah'],
      });
      setIsModalOpen(false);
      setEditingAnnouncement(null);
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      showNotification('error', '❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      isUrgent: announcement.isUrgent,
      isActive: announcement.isActive,
      targetRoles: announcement.targetRoles,
      publishDate: announcement.publishDate?.toDate(),
      expiryDate: announcement.expiryDate?.toDate(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Yakin ingin menghapus pengumuman ini?')) {
      try {
        await deleteDoc(doc(db, 'announcements', id));
        showNotification('success', '✅ Pengumuman berhasil dihapus!');
      } catch (error: any) {
        console.error('Error deleting announcement:', error);
        showNotification('error', '❌ Error: ' + error.message);
      }
    }
  };

  const toggleRole = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50"
          >
            <div
              className={`${
                notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              } text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3`}
            >
              {notification.type === 'success' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
              <span className="font-semibold">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#D4AF37] to-[#C5A572] text-white py-8 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Volume2 className="w-10 h-10" />
              <div>
                <h1 className="text-3xl font-bold">Manajemen Pengumuman</h1>
                <p className="text-white/90 mt-1">Kelola pengumuman untuk seluruh pengguna</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingAnnouncement(null);
                setFormData({
                  title: '',
                  message: '',
                  isUrgent: false,
                  isActive: true,
                  targetRoles: ['guest', 'prospective-jamaah', 'current-jamaah'],
                });
                setIsModalOpen(true);
              }}
              className="bg-white text-[#D4AF37] px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Buat Pengumuman
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Pengumuman</p>
                <p className="text-3xl font-bold text-gray-900">{announcements.length}</p>
              </div>
              <Volume2 className="w-10 h-10 text-[#D4AF37]" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Aktif</p>
                <p className="text-3xl font-bold text-green-600">
                  {announcements.filter((a) => a.isActive).length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Urgent</p>
                <p className="text-3xl font-bold text-red-600">
                  {announcements.filter((a) => a.isUrgent && a.isActive).length}
                </p>
              </div>
              <Bell className="w-10 h-10 text-red-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Non-Aktif</p>
                <p className="text-3xl font-bold text-gray-500">
                  {announcements.filter((a) => !a.isActive).length}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${
                announcement.isUrgent ? 'border-red-500' : 'border-[#D4AF37]'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      {announcement.isUrgent && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          URGENT
                        </span>
                      )}
                      <span
                        className={`${
                          announcement.isActive ? 'bg-green-500' : 'bg-gray-500'
                        } text-white px-3 py-1 rounded-full text-xs font-bold`}
                      >
                        {announcement.isActive ? 'AKTIF' : 'NON-AKTIF'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{announcement.title}</h3>

                    {/* Message */}
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{announcement.message}</p>

                    {/* Meta Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#D4AF37]" />
                        <span>
                          {announcement.createdAt?.toDate().toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#D4AF37]" />
                        <span>{announcement.targetRoles.length} Role Target</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">👤 {announcement.createdByName}</span>
                      </div>
                    </div>

                    {/* Target Roles */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {announcement.targetRoles.map((role) => (
                        <span
                          key={role}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {ROLES.find((r) => r.value === role)?.label || role}
                        </span>
                      ))}
                    </div>

                    {/* Expiry Info */}
                    {announcement.expiryDate && (
                      <div className="mt-3 text-sm text-orange-600 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Berlaku hingga:{' '}
                        {announcement.expiryDate?.toDate().toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {announcements.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <Volume2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Belum ada pengumuman</p>
              <p className="text-gray-400 text-sm">Klik tombol "Buat Pengumuman" untuk memulai</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#D4AF37] to-[#C5A572] p-6 text-white sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {editingAnnouncement ? '✏️ Edit Pengumuman' : '➕ Buat Pengumuman Baru'}
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Judul Pengumuman *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                    placeholder="Misal: Pendaftaran Umroh Ramadan 2025"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Isi Pengumuman *
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                    placeholder="Tulis pesan pengumuman di sini..."
                  />
                </div>

                {/* Urgent & Active Toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isUrgent}
                        onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                        className="w-5 h-5 accent-red-500"
                      />
                      <div>
                        <span className="font-semibold text-gray-900 block">🔔 Urgent</span>
                        <span className="text-xs text-gray-600">
                          Tampilkan alarm + notifikasi urgent
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 accent-green-500"
                      />
                      <div>
                        <span className="font-semibold text-gray-900 block">✅ Aktif</span>
                        <span className="text-xs text-gray-600">Tampilkan ke pengguna</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Target Roles */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Target Pengguna * (minimal 1)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ROLES.map((role) => (
                      <label
                        key={role.value}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.targetRoles.includes(role.value)
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.targetRoles.includes(role.value)}
                          onChange={() => toggleRole(role.value)}
                          className="mr-2 accent-[#D4AF37]"
                        />
                        <span className="text-sm font-medium text-gray-900">{role.label}</span>
                      </label>
                    ))}
                  </div>
                  {formData.targetRoles.length === 0 && (
                    <p className="text-red-500 text-sm mt-2">⚠️ Pilih minimal 1 target pengguna</p>
                  )}
                </div>

                {/* Dates (Optional) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tanggal Publish (Opsional)
                    </label>
                    <input
                      type="datetime-local"
                      value={
                        formData.publishDate
                          ? new Date(formData.publishDate.getTime() - formData.publishDate.getTimezoneOffset() * 60000)
                              .toISOString()
                              .slice(0, 16)
                          : ''
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, publishDate: e.target.value ? new Date(e.target.value) : undefined })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tanggal Kadaluarsa (Opsional)
                    </label>
                    <input
                      type="datetime-local"
                      value={
                        formData.expiryDate
                          ? new Date(formData.expiryDate.getTime() - formData.expiryDate.getTimezoneOffset() * 60000)
                              .toISOString()
                              .slice(0, 16)
                          : ''
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, expiryDate: e.target.value ? new Date(e.target.value) : undefined })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading || formData.targetRoles.length === 0}
                    className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#C5A572] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Menyimpan...' : editingAnnouncement ? 'Update Pengumuman' : 'Buat Pengumuman'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}