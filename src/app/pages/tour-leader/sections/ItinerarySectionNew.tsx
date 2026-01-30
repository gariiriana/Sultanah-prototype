import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  CheckCircle2,
  Circle,
  Check,
  Camera,
  Image as ImageIcon,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, Timestamp, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { toast } from 'sonner';

interface ActivityPhoto {
  imageBase64: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

interface Activity {
  time: string;
  activity: string;
  location: string;
  description?: string;
  photos?: ActivityPhoto[]; // ✅ NEW: Photo array
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
  tourLeaderName?: string;
  tourLeaderId?: string; // ✅ ADD: For debugging permissions
  days: DaySchedule[];
  completedDays?: number[]; // ✅ NEW: Track which days are completed
  status?: 'ongoing' | 'completed'; // ✅ NEW: Overall status
  jamaahNames?: string[]; // ✅ NEW: Names of jamaah in this package for searching
}

const ItinerarySectionNew: React.FC = () => {
  const { userProfile } = useAuth();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItineraryId, setExpandedItineraryId] = useState<string | null>(null);
  const [expandedDayNumber, setExpandedDayNumber] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null); // activityKey
  const [viewingPhotos, setViewingPhotos] = useState<ActivityPhoto[] | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // ✅ NEW
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all'); // ✅ NEW

  useEffect(() => {
    fetchItineraries();
  }, []);

  const fetchItineraries = async () => {
    try {
      setLoading(true);

      // ✅ FIX: Fetch ALL itineraries first, then filter client-side
      // Because tourLeaderId might be stored as UID or email
      const itinerariesQuery = query(
        collection(db, 'itineraries'),
        orderBy('departureDate', 'desc')
      );

      const itinerariesSnap = await getDocs(itinerariesQuery);

      const itinerariesData: Itinerary[] = [];
      const currentUserId = userProfile?.id;
      const currentUserEmail = userProfile?.email;

      console.log('🔍 Tour Leader ID:', currentUserId);
      console.log('📧 Tour Leader Email:', currentUserEmail);

      // \u2705 NEW: Fetch payments to link jamaah to packages
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('status', '==', 'approved')
      );
      const paymentsSnap = await getDocs(paymentsQuery);
      const packageToJamaahMap = new Map<string, string[]>();

      paymentsSnap.forEach(pDoc => {
        const payment = pDoc.data();
        if (payment.packageId && payment.userName) {
          const names = packageToJamaahMap.get(payment.packageId) || [];
          names.push(payment.userName.toLowerCase());
          packageToJamaahMap.set(payment.packageId, names);
        }
      });

      itinerariesSnap.forEach((doc) => {
        const data = doc.data();

        console.log('\uD83D\uDCCB Checking itinerary:', {
          packageName: data.packageName,
          tourLeaderId: data.tourLeaderId,
          tourLeaderName: data.tourLeaderName,
          match: data.tourLeaderId === currentUserId || data.tourLeaderId === currentUserEmail
        });

        // \u2705 Filter: Check if tourLeaderId matches either UID or email
        const isMyItinerary =
          data.tourLeaderId === currentUserId ||
          data.tourLeaderId === currentUserEmail;

        if (isMyItinerary) {
          console.log('\u2705 Found itinerary:', data.packageName, 'Tour Leader:', data.tourLeaderId);
          itinerariesData.push({
            id: doc.id,
            packageId: data.packageId,
            packageName: data.packageName,
            departureDate: data.departureDate,
            returnDate: data.returnDate,
            tourLeaderName: data.tourLeaderName,
            tourLeaderId: data.tourLeaderId, // \u2705 ADD: For debugging permissions
            days: data.days || [],
            completedDays: data.completedDays || [],
            status: data.status || 'ongoing',
            jamaahNames: packageToJamaahMap.get(data.packageId) || [], // \u2705 NEW
          });
        }
      });

      setItineraries(itinerariesData);
      console.log('✅ Total itineraries for tour leader:', itinerariesData.length);
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      setItineraries([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleItinerary = (itineraryId: string) => {
    setExpandedItineraryId(expandedItineraryId === itineraryId ? null : itineraryId);
    setExpandedDayNumber(null);
  };

  const toggleDay = (dayNumber: number) => {
    setExpandedDayNumber(expandedDayNumber === dayNumber ? null : dayNumber);
  };

  const markDayAsCompleted = async (itineraryId: string, dayNumber: number) => {
    try {
      const itineraryRef = doc(db, 'itineraries', itineraryId);
      const itineraryData = itineraries.find(it => it.id === itineraryId);

      if (!itineraryData) return;

      // ✅ Debug logging
      console.log('🔐 Mencoba memperbarui jadwal:', {
        itineraryId,
        dayNumber,
        tourLeaderId: itineraryData.tourLeaderId,
        currentUserId: userProfile?.id,
        currentUserEmail: userProfile?.email,
      });

      const updatedCompletedDays = [...(itineraryData.completedDays || [])];
      if (!updatedCompletedDays.includes(dayNumber)) {
        updatedCompletedDays.push(dayNumber);
      }

      await updateDoc(itineraryRef, {
        completedDays: updatedCompletedDays,
        updatedAt: Timestamp.now(),
      });

      setItineraries(prevItineraries => prevItineraries.map(it =>
        it.id === itineraryId ? { ...it, completedDays: updatedCompletedDays } : it
      ));

      toast.success(`✅ Hari ke-${dayNumber} ditandai sebagai selesai!`);
    } catch (error) {
      console.error('Error marking day as completed:', error);
      toast.error('Gagal menandai hari sebagai selesai.');
    }
  };

  const completeItinerary = async (itineraryId: string) => {
    try {
      const itinerary = itineraries.find(it => it.id === itineraryId);
      if (!itinerary) {
        toast.error('Jadwal tidak ditemukan');
        return;
      }

      // 1. Update itinerary status to completed
      const itineraryRef = doc(db, 'itineraries', itineraryId);
      await updateDoc(itineraryRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 2. Auto-upgrade all jamaah in this package to alumni
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('packageId', '==', itinerary.packageId),
        where('status', '==', 'approved')
      );

      const paymentsSnapshot = await getDocs(paymentsQuery);

      // Batch update all jamaah to alumni
      const upgradePromises = paymentsSnapshot.docs.map(async (paymentDoc) => {
        const payment = paymentDoc.data();
        const userId = payment.userId;

        if (!userId) return;

        // ✅ FIX: Check current user role before upgrading (idempotent)
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.log(`⚠️ User ${userId} not found, skipping upgrade`);
          return;
        }

        const currentRole = userSnap.data().role;

        if (currentRole !== 'current-jamaah' && currentRole !== 'prospective-jamaah' && currentRole !== 'jamaah') {
          console.log(`⚠️ User ${userId} with role ${currentRole} skipping upgrade`);
          return;
        }

        // Update user role to alumni
        await updateDoc(userRef, {
          role: 'alumni',
          upgradedToAlumniAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        console.log(`✅ User ${userId} upgraded to alumni`);

        // Create notification for jamaah to give feedback
        await addDoc(collection(db, 'notifications'), {
          userId: userId,
          type: 'trip_completed',
          title: 'Perjalanan Umrah Selesai! 🎉',
          message: `Alhamdulillah, perjalanan umrah Anda telah selesai. Berikan feedback untuk Tour Leader ${userProfile?.displayName || 'kami'}.`,
          tourLeaderId: userProfile?.id,
          tourLeaderName: userProfile?.displayName,
          itineraryId: itineraryId,
          packageId: itinerary.packageId,
          read: false,
          createdAt: Timestamp.now(),
        });
      });

      await Promise.all(upgradePromises);

      // Update local state
      setItineraries(prevItineraries => prevItineraries.map(it =>
        it.id === itineraryId ? { ...it, status: 'completed' } : it
      ));

      toast.success('🎉 Perjalanan selesai! Semua jamaah telah di-upgrade ke status Alumni.');
    } catch (error) {
      console.error('Error completing itinerary:', error);
      toast.error('Gagal menyelesaikan perjalanan.');
    }
  };

  // \u2705 NEW: Upload photo for activity
  const handleActivityPhotoUpload = async (
    itineraryId: string,
    dayNumber: number,
    activityIndex: number,
    file: File
  ) => {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Hanya file gambar yang diperbolehkan');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran foto maksimal 2MB');
        return;
      }

      const activityKey = `${itineraryId}-${dayNumber}-${activityIndex}`;
      setUploadingPhoto(activityKey);

      // Convert to Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Find itinerary and activity
      const itinerary = itineraries.find(it => it.id === itineraryId);
      if (!itinerary) {
        toast.error('Jadwal tidak ditemukan');
        return;
      }

      const day = itinerary.days.find(d => d.dayNumber === dayNumber);
      if (!day || !day.activities[activityIndex]) {
        toast.error('Aktivitas tidak ditemukan');
        return;
      }

      const activity = day.activities[activityIndex];

      // Create photo object
      const newPhoto: ActivityPhoto = {
        imageBase64: base64,
        uploadedBy: userProfile?.id || '',
        uploadedByName: userProfile?.displayName || 'Tour Leader',
        uploadedAt: new Date().toISOString(),
      };

      // Update activity in days array
      const updatedDays = itinerary.days.map(d => {
        if (d.dayNumber === dayNumber) {
          return {
            ...d,
            activities: d.activities.map((act, idx) => {
              if (idx === activityIndex) {
                return {
                  ...act,
                  photos: [...(act.photos || []), newPhoto]
                };
              }
              return act;
            })
          };
        }
        return d;
      });

      // Update Firestore
      const itineraryRef = doc(db, 'itineraries', itineraryId);
      await updateDoc(itineraryRef, {
        days: updatedDays,
        updatedAt: Timestamp.now(),
      });

      // Update local state
      setItineraries(prevItineraries =>
        prevItineraries.map(it =>
          it.id === itineraryId ? { ...it, days: updatedDays } : it
        )
      );

      toast.success(`\u2705 Foto berhasil diupload untuk ${activity.activity}!`);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Gagal mengupload foto');
    } finally {
      setUploadingPhoto(null);
    }
  };

  // \u2705 NEW: Instant Filter Logic
  const filteredItineraries = itineraries.filter(it => {
    const searchLower = searchQuery.toLowerCase().trim();
    const now = new Date();
    const departureDate = new Date(it.departureDate);
    const returnDate = new Date(it.returnDate);

    // Instant search (Live Search) by Package Name or Jamaah Name
    const matchesSearch = !searchLower ||
      it.packageName.toLowerCase().includes(searchLower) ||
      it.jamaahNames?.some(name => name.includes(searchLower));

    // Status Filter logic
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = departureDate <= now && now <= returnDate && it.status !== 'completed';
    } else if (statusFilter === 'upcoming') {
      matchesStatus = departureDate > now;
    } else if (statusFilter === 'completed') {
      matchesStatus = it.status === 'completed' || returnDate < now;
    }

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
          <p className="text-gray-500 text-sm">Memuat jadwal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Jadwal Perjalanan</h2>
            <p className="text-gray-500 text-sm">{filteredItineraries.length} paket perjalanan</p>
          </div>
        </div>
      </div>

      {/* \u2705 NEW: Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama paket..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 h-12 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative md:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full pl-12 pr-4 h-12 bg-white border border-gray-300 rounded-xl text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none appearance-none cursor-pointer transition-all"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="upcoming">Akan Datang</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
      </div>

      {/* Itineraries List */}
      {filteredItineraries.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-900 font-semibold text-lg mb-1">
            {searchQuery || statusFilter !== 'all' ? 'Tidak ada jadwal ditemukan' : 'Tidak ada jadwal yang ditugaskan'}
          </p>
          <p className="text-sm text-gray-500">
            {searchQuery || statusFilter !== 'all' ? 'Coba sesuaikan pencarian atau filter Anda' : 'Jadwal akan muncul di sini setelah admin menugaskan perjalanan kepada Anda'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItineraries.map((itinerary) => {
            const completedCount = itinerary.completedDays?.length || 0;
            const totalDays = itinerary.days.length;
            const allDaysCompleted = completedCount === totalDays && totalDays > 0;
            const progressPercent = totalDays > 0 ? (completedCount / totalDays) * 100 : 0;
            const isFullyCompleted = itinerary.status === 'completed';

            // Determine status and color
            const now = new Date();
            const departureDate = new Date(itinerary.departureDate);
            const returnDate = new Date(itinerary.returnDate);

            let statusBadge = { label: 'Akan Datang', color: 'blue', borderColor: 'border-blue-400', bgColor: 'bg-blue-50' };
            if (isFullyCompleted) {
              statusBadge = { label: 'Selesai', color: 'green', borderColor: 'border-green-400', bgColor: 'bg-green-50' };
            } else if (departureDate <= now && now <= returnDate) {
              statusBadge = { label: 'Aktif', color: 'emerald', borderColor: 'border-emerald-400', bgColor: 'bg-emerald-50' };
            }

            return (
              <motion.div
                key={itinerary.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white border-l-4 ${statusBadge.borderColor} rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${statusBadge.bgColor}`}
              >
                {/* Itinerary Header */}
                <div className="p-6 bg-white">
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleItinerary(itinerary.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {itinerary.packageName}
                          </h3>
                          <span className={`px-3 py-1.5 bg-${statusBadge.color}-100 text-${statusBadge.color}-700 text-xs font-bold rounded-full border border-${statusBadge.color}-200 shadow-sm`}>
                            {statusBadge.label === 'Aktif' && '🔥 '}
                            {statusBadge.label === 'Selesai' && '✓ '}
                            {statusBadge.label === 'Akan Datang' && '📅 '}
                            {statusBadge.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-5 text-sm">
                          <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-sm">
                              <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <span>
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
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                              <Clock className="w-5 h-5 text-white" />
                            </div>
                            <span>{totalDays} hari</span>
                          </div>
                        </div>
                      </div>
                      <motion.div
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                        animate={{ rotate: expandedItineraryId === itinerary.id ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-6 h-6 text-gray-600" />
                      </motion.div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          Progres: {completedCount}/{totalDays} hari Selesai
                        </span>
                        <span className={`text-sm font-bold ${progressPercent === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${progressPercent === 100
                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                            : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600'
                            } shadow-sm`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Complete Report Button - Show when all days completed but not yet fully completed */}
                  {allDaysCompleted && !isFullyCompleted && (
                    <div className="mt-5 pt-5 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          completeItinerary(itinerary.id);
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3.5 px-5 rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Selesaikan Laporan & Upgrade Jamaah ke Alumni
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded: Days List */}
                <AnimatePresence>
                  {expandedItineraryId === itinerary.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 overflow-hidden"
                    >
                      <div className="p-5 space-y-3">
                        {itinerary.days.map((day) => {
                          const isDayCompleted = itinerary.completedDays?.includes(day.dayNumber) || false;

                          return (
                            <div
                              key={day.dayNumber}
                              className={`border rounded-lg overflow-hidden transition-all ${isDayCompleted
                                ? 'border-green-500 bg-green-50/30'
                                : 'border-gray-200'
                                }`}
                            >
                              {/* Day Header */}
                              <div
                                className={`p-4 transition-colors ${isDayCompleted
                                  ? 'bg-green-50 hover:bg-green-100'
                                  : 'bg-gray-50 hover:bg-gray-100'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => toggleDay(day.dayNumber)}
                                  >
                                    <h4 className={`font-semibold mb-1 ${isDayCompleted ? 'text-green-700' : 'text-gray-900'
                                      }`}>
                                      Hari {day.dayNumber}: {day.title}
                                    </h4>
                                    {day.date && (
                                      <p className={`text-sm flex items-center gap-2 ${isDayCompleted ? 'text-green-600' : 'text-gray-600'
                                        }`}>
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(day.date).toLocaleDateString('id-ID', {
                                          weekday: 'long',
                                          day: 'numeric',
                                          month: 'long',
                                        })}
                                      </p>
                                    )}
                                  </div>

                                  {/* Completion Checkbox */}
                                  <div className="flex items-center gap-3">
                                    {isDayCompleted ? (
                                      <div className="flex items-center gap-2 text-green-600 bg-green-100 px-3 py-1.5 rounded-full">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="text-sm font-medium">Selesai</span>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markDayAsCompleted(itinerary.id, day.dayNumber);
                                        }}
                                        className="flex items-center gap-2 text-gray-500 hover:text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-full transition-all border border-gray-300 hover:border-green-500"
                                      >
                                        <Circle className="w-5 h-5" />
                                        <span className="text-sm font-medium">Tandai Selesai</span>
                                      </button>
                                    )}

                                    {/* Expand/Collapse Icon */}
                                    <button
                                      onClick={() => toggleDay(day.dayNumber)}
                                      className="w-6 h-6 flex items-center justify-center"
                                    >
                                      {expandedDayNumber === day.dayNumber ? (
                                        <ChevronUp className="w-4 h-4 text-gray-600" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-600" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Day Activities */}
                              <AnimatePresence>
                                {expandedDayNumber === day.dayNumber && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-white p-4 space-y-3"
                                  >
                                    {day.activities.length === 0 ? (
                                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">
                                          Tidak ada aktivitas terjadwal
                                        </p>
                                      </div>
                                    ) : (
                                      day.activities.map((activity, idx) => {
                                        const activityKey = `${itinerary.id}-${day.dayNumber}-${idx}`;
                                        const isUploading = uploadingPhoto === activityKey;
                                        const photos = activity.photos || [];

                                        return (
                                          <div
                                            key={idx}
                                            className="bg-gray-50 rounded-lg border border-gray-100 hover:border-[#D4AF37]/30 transition-colors overflow-hidden"
                                          >
                                            {/* Activity Info */}
                                            <div className="flex gap-3 p-3">
                                              <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-gradient-to-br from-[#C5A572] to-[#D4AF37] rounded-lg flex items-center justify-center shadow-sm">
                                                  <Clock className="w-5 h-5 text-white" />
                                                </div>
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <span className="font-bold text-[#D4AF37]">
                                                    {activity.time}
                                                  </span>
                                                </div>
                                                <h5 className="font-semibold text-gray-900 mb-1">
                                                  {activity.activity}
                                                </h5>
                                                {activity.location && (
                                                  <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                                                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                                                    {activity.location}
                                                  </p>
                                                )}
                                                {activity.description && (
                                                  <p className="text-sm text-gray-700 mt-2 bg-white rounded-md p-2 border border-gray-100">
                                                    {activity.description}
                                                  </p>
                                                )}
                                              </div>
                                            </div>

                                            {/* ✅ NEW: Photo Upload & Display */}
                                            <div className="px-3 pb-3 space-y-2">
                                              {/* Upload Button */}
                                              <div>
                                                <input
                                                  type="file"
                                                  id={`photo-${activityKey}`}
                                                  accept="image/*"
                                                  className="hidden"
                                                  onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                      handleActivityPhotoUpload(
                                                        itinerary.id,
                                                        day.dayNumber,
                                                        idx,
                                                        file
                                                      );
                                                      e.target.value = ''; // Reset
                                                    }
                                                  }}
                                                />
                                                <label
                                                  htmlFor={`photo-${activityKey}`}
                                                  className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border-2 border-dashed transition-all cursor-pointer ${isUploading
                                                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 cursor-wait'
                                                    : 'border-gray-300 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5'
                                                    }`}
                                                >
                                                  {isUploading ? (
                                                    <>
                                                      <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                                                      <span className="text-sm font-medium text-gray-700">
                                                        Mengupload...
                                                      </span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Camera className="w-4 h-4 text-[#D4AF37]" />
                                                      <span className="text-sm font-medium text-gray-700">
                                                        {photos.length > 0 ? 'Tambah Foto' : 'Upload Foto Kegiatan'}
                                                      </span>
                                                    </>
                                                  )}
                                                </label>
                                              </div>

                                              {/* Photo Gallery */}
                                              {photos.length > 0 && (
                                                <div className="bg-white rounded-lg p-2 border border-gray-200">
                                                  <div className="flex items-center gap-1.5 mb-2">
                                                    <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
                                                    <span className="text-xs font-semibold text-gray-700">
                                                      {photos.length} Foto
                                                    </span>
                                                  </div>
                                                  <div className="grid grid-cols-3 gap-2">
                                                    {photos.map((photo, photoIdx) => (
                                                      <motion.div
                                                        key={photoIdx}
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="relative aspect-square rounded-lg overflow-hidden shadow-sm cursor-pointer group"
                                                        onClick={() => setViewingPhotos(photos)}
                                                      >
                                                        <img
                                                          src={photo.imageBase64}
                                                          alt={`${activity.activity} - ${photoIdx + 1}`}
                                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                          <ImageIcon className="w-6 h-6 text-white" />
                                                        </div>
                                                      </motion.div>
                                                    ))}
                                                  </div>
                                                  <p className="text-xs text-gray-500 mt-2">
                                                    Klik foto untuk memperbesar
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {viewingPhotos && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setViewingPhotos(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setViewingPhotos(null)}
                className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Photo Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewingPhotos.map((photo, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-xl overflow-hidden shadow-2xl"
                  >
                    <img
                      src={photo.imageBase64}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-auto"
                    />
                    <div className="p-4 bg-gray-50">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Diupload oleh:</span> {photo.uploadedByName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(photo.uploadedAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ItinerarySectionNew;