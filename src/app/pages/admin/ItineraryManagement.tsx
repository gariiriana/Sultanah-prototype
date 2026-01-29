import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'sonner';

interface Activity {
  time: string;
  activity: string;
  location: string;
  description?: string;
}

interface DaySchedule {
  dayNumber: number;
  date: string;
  title: string;
  activities: Activity[];
}

interface Itinerary {
  id: string;
  packageId: string;
  packageName: string;
  departureDate: string;
  returnDate: string;
  tourLeaderId?: string;
  tourLeaderName?: string;
  muthawifId?: string;      // ✅ NEW: Muthawif ID
  muthawifName?: string;    // ✅ NEW: Muthawif Name
  jamaahIds?: string[];  // ✅ NEW: Array of approved jamaah user IDs
  jamaahCount?: number;   // ✅ NEW: Number of jamaah in this group
  days: DaySchedule[];
  createdAt: any;
  updatedAt: any;
}

interface UmrahPackage {
  id: string;
  name: string;
  duration: number;
  tourLeaderId?: string;      // ✅ NEW: Tour Leader ID from package
  tourLeaderName?: string;    // ✅ NEW: Tour Leader Name from package
  muthawifId?: string;        // ✅ NEW: Muthawif ID from package
  muthawifName?: string;      // ✅ NEW: Muthawif Name from package
}

interface TourLeader {
  id: string;
  displayName: string;
  email: string;
}

// ✅ NEW: Muthawif interface
interface Muthawif {
  id: string;
  displayName: string;
  email: string;
}

const ItineraryManagement: React.FC = () => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [packages, setPackages] = useState<UmrahPackage[]>([]);
  const [tourLeaders, setTourLeaders] = useState<TourLeader[]>([]);
  const [muthawifs, setMuthawifs] = useState<Muthawif[]>([]); // ✅ NEW: Muthawif state
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Itinerary, 'id' | 'createdAt' | 'updatedAt'>>({
    packageId: '',
    packageName: '',
    departureDate: '',
    returnDate: '',
    tourLeaderId: '',
    tourLeaderName: '',
    muthawifId: '',       // ✅ NEW: Muthawif ID
    muthawifName: '',     // ✅ NEW: Muthawif Name
    days: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch itineraries
      const itinerariesQuery = query(
        collection(db, 'itineraries'),
        orderBy('departureDate', 'desc')
      );
      const itinerariesSnap = await getDocs(itinerariesQuery);
      const itinerariesData: Itinerary[] = [];
      itinerariesSnap.forEach((doc) => {
        itinerariesData.push({ id: doc.id, ...doc.data() } as Itinerary);
      });
      setItineraries(itinerariesData);

      // Fetch packages
      const packagesSnap = await getDocs(collection(db, 'packages'));
      const packagesData: UmrahPackage[] = [];
      packagesSnap.forEach((doc) => {
        const data = doc.data();
        packagesData.push({
          id: doc.id,
          name: data.name,
          duration: data.duration || 9,
          tourLeaderId: data.tourLeaderId,      // ✅ NEW: Tour Leader ID from package
          tourLeaderName: data.tourLeaderName,    // ✅ NEW: Tour Leader Name from package
          muthawifId: data.muthawifId,            // ✅ NEW: Muthawif ID from package
          muthawifName: data.muthawifName,          // ✅ NEW: Muthawif Name from package
        });
      });
      setPackages(packagesData);

      // Fetch tour leaders
      const usersSnap = await getDocs(collection(db, 'users'));
      const tourLeadersData: TourLeader[] = [];
      usersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.role === 'tour-leader') {  // ✅ FIX: Lowercase dengan dash
          tourLeadersData.push({
            id: doc.id,
            displayName: data.displayName || data.email,
            email: data.email,
          });
        }
      });
      setTourLeaders(tourLeadersData);

      // ✅ NEW: Fetch muthawifs
      const muthawifsSnap = await getDocs(collection(db, 'users'));
      const muthawifsData: Muthawif[] = [];
      muthawifsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.role === 'mutawwif') {  // ✅ FIX: Correct spelling with double 'w'
          muthawifsData.push({
            id: doc.id,
            displayName: data.displayName || data.email,
            email: data.email,
          });
        }
      });
      setMuthawifs(muthawifsData);

      console.log('✅ Loaded:', itinerariesData.length, 'itineraries');
      console.log('📦 Packages with Tour Leaders:', packagesData.filter(p => p.tourLeaderId).length);
      console.log('👨‍✈️ Tour Leaders found:', tourLeadersData.length);
      console.log('👨‍✈️ Muthawifs found:', muthawifsData.length);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageChange = (packageId: string) => {
    const selectedPackage = packages.find((p) => p.id === packageId);
    if (selectedPackage) {
      console.log('📦 Selected Package:', selectedPackage.name);
      console.log('👨‍✈️ Tour Leader ID:', selectedPackage.tourLeaderId);
      console.log('👨‍✈️ Tour Leader Name:', selectedPackage.tourLeaderName);

      setFormData({
        ...formData,
        packageId,
        packageName: selectedPackage.name,
        // ✅ AUTO-FILL: Tour Leader dari package data
        tourLeaderId: selectedPackage.tourLeaderId || '',
        tourLeaderName: selectedPackage.tourLeaderName || '',
        // ✅ AUTO-FILL: Muthawif dari package data
        muthawifId: selectedPackage.muthawifId || '',
        muthawifName: selectedPackage.muthawifName || '',
        days: Array.from({ length: selectedPackage.duration }, (_, i) => ({
          dayNumber: i + 1,
          date: '',
          title: `Day ${i + 1}`,
          activities: [{ time: '08:00', activity: '', location: '', description: '' }],
        })),
      });
    }
  };

  const handleTourLeaderChange = (tourLeaderId: string) => {
    const selectedTL = tourLeaders.find((tl) => tl.id === tourLeaderId);
    setFormData({
      ...formData,
      tourLeaderId,
      tourLeaderName: selectedTL?.displayName || '',
    });
  };

  const handleMuthawifChange = (muthawifId: string) => {
    const selectedMuthawif = muthawifs.find((m) => m.id === muthawifId);
    setFormData({
      ...formData,
      muthawifId,
      muthawifName: selectedMuthawif?.displayName || '',
    });
  };

  const addActivity = (dayIndex: number) => {
    const newDays = [...formData.days];
    newDays[dayIndex].activities.push({
      time: '08:00',
      activity: '',
      location: '',
      description: '',
    });
    setFormData({ ...formData, days: newDays });
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const newDays = [...formData.days];
    newDays[dayIndex].activities.splice(activityIndex, 1);
    setFormData({ ...formData, days: newDays });
  };

  const updateActivity = (
    dayIndex: number,
    activityIndex: number,
    field: keyof Activity,
    value: string
  ) => {
    const newDays = [...formData.days];
    newDays[dayIndex].activities[activityIndex][field] = value;
    setFormData({ ...formData, days: newDays });
  };

  const updateDay = (dayIndex: number, field: keyof DaySchedule, value: any) => {
    const newDays = [...formData.days];
    (newDays[dayIndex] as any)[field] = value;
    setFormData({ ...formData, days: newDays });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.packageId || !formData.departureDate || !formData.returnDate) {
        toast.error('Please fill in all required fields');
        return;
      }

      const itineraryData = {
        ...formData,
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'itineraries', editingId), itineraryData);
        toast.success('✅ Itinerary updated successfully!');
      } else {
        await addDoc(collection(db, 'itineraries'), {
          ...itineraryData,
          createdAt: Timestamp.now(),
        });
        toast.success('✅ Itinerary created successfully!');
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast.error('Failed to save itinerary');
    }
  };

  const handleEdit = (itinerary: Itinerary) => {
    setFormData({
      packageId: itinerary.packageId,
      packageName: itinerary.packageName,
      departureDate: itinerary.departureDate,
      returnDate: itinerary.returnDate,
      tourLeaderId: itinerary.tourLeaderId || '',
      tourLeaderName: itinerary.tourLeaderName || '',
      muthawifId: itinerary.muthawifId || '',       // ✅ NEW: Muthawif ID
      muthawifName: itinerary.muthawifName || '',     // ✅ NEW: Muthawif Name
      days: itinerary.days,
    });
    setEditingId(itinerary.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this itinerary?')) return;

    try {
      await deleteDoc(doc(db, 'itineraries', id));
      toast.success('✅ Jadwal berhasil dihapus!');
      fetchData();
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      toast.error('Gagal menghapus jadwal');
    }
  };

  const resetForm = () => {
    setFormData({
      packageId: '',
      packageName: '',
      departureDate: '',
      returnDate: '',
      tourLeaderId: '',
      tourLeaderName: '',
      muthawifId: '',       // ✅ NEW: Muthawif ID
      muthawifName: '',     // ✅ NEW: Muthawif Name
      days: [],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#C5A572] to-[#D4AF37] rounded-xl flex items-center justify-center shadow-md">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manajemen Jadwal Keberangkatan</h2>
            <p className="text-sm text-gray-500">Kelola jadwal keberangkatan & aktivitas harian</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            resetForm();
          }}
          className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jadwal
        </Button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => {
              setShowForm(false);
              setEditingId(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingId ? 'Edit Jadwal' : 'Buat Jadwal Baru'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Paket *
                    </label>
                    <select
                      value={formData.packageId}
                      onChange={(e) => handlePackageChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                      required
                    >
                      <option value="">Pilih Paket</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.duration} hari)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tour Leader {formData.tourLeaderId && formData.packageId && '(Otomatis)'}
                    </label>
                    <select
                      value={formData.tourLeaderId}
                      onChange={(e) => handleTourLeaderChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!!(formData.packageId && packages.find(p => p.id === formData.packageId)?.tourLeaderId)}
                    >
                      <option value="">Pilih Tour Leader (Opsional)</option>
                      {tourLeaders.map((tl) => (
                        <option key={tl.id} value={tl.id}>
                          {tl.displayName}
                        </option>
                      ))}
                    </select>
                    {/* ✅ Helper text: Show if auto-filled from package */}
                    {formData.tourLeaderId && formData.packageId && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <span>🔒</span>
                        <span>Otomatis dari data paket (tidak dapat diubah)</span>
                      </p>
                    )}
                    {!formData.tourLeaderId && formData.packageId && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Belum ada tour leader di paket ini. Atur tour leader di Manajemen Paket.</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Muthawif {formData.muthawifId && formData.packageId && '(Otomatis)'}
                    </label>
                    <select
                      value={formData.muthawifId}
                      onChange={(e) => handleMuthawifChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={!!(formData.packageId && packages.find(p => p.id === formData.packageId)?.muthawifId)}
                    >
                      <option value="">Pilih Muthawif (Opsional)</option>
                      {muthawifs.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.displayName}
                        </option>
                      ))}
                    </select>
                    {/* ✅ Helper text: Show if auto-filled from package */}
                    {formData.muthawifId && formData.packageId && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <span>🔒</span>
                        <span>Otomatis dari data paket (tidak dapat diubah)</span>
                      </p>
                    )}
                    {!formData.muthawifId && formData.packageId && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Belum ada muthawif di paket ini. Atur muthawif di Manajemen Paket.</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Keberangkatan *
                    </label>
                    <input
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) =>
                        setFormData({ ...formData, departureDate: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Kepulangan *
                    </label>
                    <input
                      type="date"
                      value={formData.returnDate}
                      onChange={(e) =>
                        setFormData({ ...formData, returnDate: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Days Schedule */}
                {formData.days.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#D4AF37]" />
                      Jadwal Harian ({formData.days.length} hari)
                    </h4>

                    {formData.days.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className="border border-gray-200 rounded-xl p-4 space-y-3"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Hari
                            </label>
                            <input
                              type="number"
                              value={day.dayNumber}
                              readOnly
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Tanggal
                            </label>
                            <input
                              type="date"
                              value={day.date}
                              onChange={(e) => updateDay(dayIndex, 'date', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Judul
                            </label>
                            <input
                              type="text"
                              value={day.title}
                              onChange={(e) => updateDay(dayIndex, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                              placeholder="Contoh: Tiba di Madinah"
                            />
                          </div>
                        </div>

                        {/* Activities */}
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-gray-600">
                            Aktivitas
                          </label>
                          {day.activities.map((activity, activityIndex) => (
                            <div
                              key={activityIndex}
                              className="bg-gray-50 rounded-lg p-3 space-y-2"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <input
                                  type="time"
                                  value={activity.time}
                                  onChange={(e) =>
                                    updateActivity(dayIndex, activityIndex, 'time', e.target.value)
                                  }
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <input
                                  type="text"
                                  value={activity.activity}
                                  onChange={(e) =>
                                    updateActivity(
                                      dayIndex,
                                      activityIndex,
                                      'activity',
                                      e.target.value
                                    )
                                  }
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  placeholder="Nama aktivitas"
                                />
                                <input
                                  type="text"
                                  value={activity.location}
                                  onChange={(e) =>
                                    updateActivity(
                                      dayIndex,
                                      activityIndex,
                                      'location',
                                      e.target.value
                                    )
                                  }
                                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                  placeholder="Lokasi"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeActivity(dayIndex, activityIndex)}
                                  className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={activity.description || ''}
                                onChange={(e) =>
                                  updateActivity(
                                    dayIndex,
                                    activityIndex,
                                    'description',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Deskripsi (opsional)"
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addActivity(dayIndex)}
                            className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                          >
                            + Tambah Aktivitas
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white hover:opacity-90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? 'Simpan' : 'Buat'} Jadwal
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Itinerary List */}
      <div className="space-y-4">
        {itineraries.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Belum ada jadwal</p>
            <p className="text-sm text-gray-500 mt-1">
              Buat jadwal keberangkatan pertama Anda
            </p>
          </div>
        ) : (
          itineraries.map((itinerary) => (
            <motion.div
              key={itinerary.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">
                    {itinerary.packageName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-[#D4AF37]" />
                      {new Date(itinerary.departureDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      -{' '}
                      {new Date(itinerary.returnDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    {itinerary.tourLeaderName && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4 text-blue-500" />
                        {itinerary.tourLeaderName}
                      </div>
                    )}
                    {itinerary.muthawifName && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4 text-blue-500" />
                        {itinerary.muthawifName}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-green-500" />
                      {itinerary.days.length} hari
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedId(expandedId === itinerary.id ? null : itinerary.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    {expandedId === itinerary.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(itinerary)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(itinerary.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedId === itinerary.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 pt-4 mt-4 space-y-3"
                  >
                    {itinerary.days.map((day) => (
                      <div key={day.dayNumber} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Hari {day.dayNumber}: {day.title}
                        </h4>
                        {day.date && (
                          <p className="text-sm text-gray-500 mb-3">
                            {new Date(day.date).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                        <div className="space-y-2">
                          {day.activities.map((activity, idx) => (
                            <div key={idx} className="flex gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-600 min-w-[60px]">
                                <Clock className="w-3.5 h-3.5" />
                                {activity.time}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{activity.activity}</p>
                                {activity.location && (
                                  <p className="text-gray-600 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {activity.location}
                                  </p>
                                )}
                                {activity.description && (
                                  <p className="text-gray-500 mt-1">{activity.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ItineraryManagement;