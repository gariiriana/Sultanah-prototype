import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ChevronUp,
  Plane,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
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
  muthawifId?: string; // ✅ NEW: Muthawif ID
  muthawifName?: string; // ✅ NEW: Muthawif name
  jamaahIds?: string[];
  jamaahCount?: number;
  days: DaySchedule[];
  completedDays?: number[]; // ✅ NEW: Track completed days
  status?: 'ongoing' | 'completed'; // ✅ NEW: Overall status
  createdAt: any;
  updatedAt: any;
}

interface ItineraryViewerProps {
  onClose: () => void;
}

export default function ItineraryViewer({ onClose }: ItineraryViewerProps) {
  const { currentUser } = useAuth();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyItineraries();
  }, [currentUser]);

  // ❌ REMOVED: Auto-upgrade to alumni when jamaah views itinerary
  // Upgrade now happens ONLY when Tour Leader clicks "Complete" on itinerary
  // This ensures business process flow is correct:
  // 1. Jamaah views itinerary (no status change)
  // 2. Tour Leader completes trip → clicks "Complete"
  // 3. System auto-upgrades all jamaah in that package to Alumni

  const fetchMyItineraries = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch all itineraries
      const itinerariesQuery = query(
        collection(db, 'itineraries'),
        orderBy('departureDate', 'desc')
      );

      const snapshot = await getDocs(itinerariesQuery);
      const allItineraries: Itinerary[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as Itinerary;
        allItineraries.push({ id: doc.id, ...data });
      });

      // Filter itineraries where current user is in jamaahIds
      // OR if jamaahIds doesn't exist (show all for backward compatibility)
      const myItineraries = allItineraries.filter(
        (itinerary) => 
          !itinerary.jamaahIds || // No jamaahIds means available to all
          itinerary.jamaahIds.length === 0 || // Empty array means available to all
          itinerary.jamaahIds.includes(currentUser.uid) // User is explicitly included
      );

      setItineraries(myItineraries);

      console.log('✅ Loaded', myItineraries.length, 'itineraries for user');
    } catch (error) {
      console.error('Error fetching itineraries:', error);
      toast.error('Gagal memuat jadwal pemberangkatan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">📅 Jadwal Pemberangkatan Saya</h2>
                <p className="text-teal-100 text-sm mt-1">Lihat jadwal keberangkatan umroh Anda</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Memuat jadwal...</p>
            </div>
          ) : itineraries.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plane className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Jadwal</h3>
              <p className="text-gray-600 mb-4">
                Jadwal pemberangkatan akan muncul setelah admin membuatkan jadwal untuk Anda
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 text-left">
                    <p className="font-semibold mb-1">Informasi:</p>
                    <p>
                      Pastikan Anda sudah melakukan pembayaran dan statusnya <strong>Approved</strong>. 
                      Admin akan membuatkan jadwal pemberangkatan untuk Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {itineraries.map((itinerary) => {
                const completedCount = itinerary.completedDays?.length || 0;
                const totalDays = itinerary.days.length;
                const progressPercent = totalDays > 0 ? (completedCount / totalDays) * 100 : 0;
                const isFullyCompleted = itinerary.status === 'completed';

                return (
                <motion.div
                  key={itinerary.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-gradient-to-br from-white to-gray-50 border-2 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${
                    isFullyCompleted ? 'border-green-500' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
                          <Plane className="w-5 h-5 text-teal-600" />
                          {itinerary.packageName}
                        </h3>
                        {isFullyCompleted && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Selesai
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <div>
                            <span className="font-semibold">Berangkat:</span>{' '}
                            {new Date(itinerary.departureDate).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          <div>
                            <span className="font-semibold">Pulang:</span>{' '}
                            {new Date(itinerary.returnDate).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                        {itinerary.tourLeaderName && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4 text-blue-600" />
                            <div>
                              <span className="font-semibold">Tour Leader:</span> {itinerary.tourLeaderName}
                            </div>
                          </div>
                        )}
                        {itinerary.muthawifName && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="w-4 h-4 text-blue-600" />
                            <div>
                              <span className="font-semibold">Muthawif:</span> {itinerary.muthawifName}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-green-600" />
                          <div>
                            <span className="font-semibold">Durasi:</span> {itinerary.days.length} Hari
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === itinerary.id ? null : itinerary.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg ml-4"
                    >
                      {expandedId === itinerary.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* ✅ Progress Bar - NEW */}
                  {totalDays > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progress: {completedCount}/{totalDays} hari
                        </span>
                        <span className="text-sm font-semibold text-teal-600">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            progressPercent === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-teal-500 to-teal-600'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedId === itinerary.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t-2 border-gray-200 pt-4 mt-4 space-y-3"
                      >
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-teal-600" />
                          Detail Jadwal Harian
                        </h4>
                        {itinerary.days.map((day) => {
                          const isDayCompleted = itinerary.completedDays?.includes(day.dayNumber) || false;
                          
                          return (
                          <div
                            key={day.dayNumber}
                            className={`bg-white rounded-xl p-4 border-2 shadow-sm transition-all ${
                              isDayCompleted ? 'border-green-500 bg-green-50/30' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                                isDayCompleted ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-teal-500 to-teal-600'
                              }`}>
                                {day.dayNumber}
                              </div>
                              <div className="flex-1">
                                <h5 className={`font-bold ${isDayCompleted ? 'text-green-700' : 'text-gray-900'}`}>
                                  {day.title}
                                </h5>
                                {day.date && (
                                  <p className={`text-sm ${isDayCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                                    {new Date(day.date).toLocaleDateString('id-ID', {
                                      weekday: 'long',
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </p>
                                )}
                              </div>
                              {isDayCompleted && (
                                <div className="flex items-center gap-1 text-green-600 bg-green-100 px-3 py-1.5 rounded-full">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-xs font-semibold">Selesai</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              {day.activities.map((activity, idx) => (
                                <div key={idx} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 text-teal-600 min-w-[70px] font-semibold">
                                    <Clock className="w-4 h-4" />
                                    {activity.time}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{activity.activity}</p>
                                    {activity.location && (
                                      <p className="text-gray-600 flex items-center gap-1 mt-1 text-sm">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {activity.location}
                                      </p>
                                    )}
                                    {activity.description && (
                                      <p className="text-gray-500 mt-2 text-sm">{activity.description}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}