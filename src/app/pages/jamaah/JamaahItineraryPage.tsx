import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
// ❌ REMOVED: TourLeaderFeedbackDialog - Feedback now only available for Alumni
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
  tourLeaderName?: string;
  tourLeaderId?: string;
  days: DaySchedule[];
  status?: string;
}

const JamaahItineraryPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  // ❌ REMOVED: Feedback states - Feedback now only available for Alumni
  // const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  // const [showFeedbackNotification, setShowFeedbackNotification] = useState(false);

  useEffect(() => {
    fetchUserItinerary();
    // ❌ REMOVED: Feedback notification check - Feedback now only available for Alumni
    // checkForFeedbackNotification();
  }, []);

  // ❌ REMOVED: Feedback notification check - Feedback now only available for Alumni
  // const checkForFeedbackNotification = async () => {
  //   if (!currentUser) return;

  //   try {
  //     // Check for trip_completed notifications
  //     const notificationsQuery = query(
  //       collection(db, 'notifications'),
  //       where('userId', '==', currentUser.uid),
  //       where('type', '==', 'trip_completed'),
  //       where('read', '==', false)
  //     );

  //     const notificationsSnap = await getDocs(notificationsQuery);
      
  //     if (!notificationsSnap.empty) {
  //       setShowFeedbackNotification(true);
  //       // Auto-open feedback dialog after 2 seconds
  //       setTimeout(() => {
  //         setFeedbackDialogOpen(true);
  //       }, 2000);
  //     }
  //   } catch (error) {
  //     console.error('Error checking notifications:', error);
  //   }
  // };

  const fetchUserItinerary = async () => {
    try {
      setLoading(true);

      // ✅ FIX: Ensure userId is defined before query
      const userId = userProfile?.id || userProfile?.email;
      if (!userId) {
        console.log('No valid userId for itinerary fetch');
        setItinerary(null);
        setLoading(false);
        return;
      }

      // 1. Get user's approved payment
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', userId),
        where('status', '==', 'approved')
      );
      const paymentsSnap = await getDocs(paymentsQuery);

      if (paymentsSnap.empty) {
        console.log('❌ No approved payment found');
        setItinerary(null);
        setLoading(false);
        return;
      }

      // Get first approved payment
      const payment = paymentsSnap.docs[0].data();
      const packageId = payment.packageId;
      const bookingDate = payment.bookingDate || payment.createdAt?.toDate();

      // ✅ FIX: Ensure packageId exists before querying itineraries
      if (!packageId) {
        console.log('❌ No packageId found in payment');
        setItinerary(null);
        setLoading(false);
        return;
      }

      console.log('✅ Payment found:', { packageId, bookingDate });

      // 2. Find matching itinerary
      const itinerariesQuery = query(
        collection(db, 'itineraries'),
        where('packageId', '==', packageId),
        orderBy('departureDate', 'desc')
      );
      const itinerariesSnap = await getDocs(itinerariesQuery);

      if (itinerariesSnap.empty) {
        console.log('❌ No itinerary found for this package');
        setItinerary(null);
        setLoading(false);
        return;
      }

      // Find itinerary with closest departure date
      let matchedItinerary: Itinerary | null = null;
      itinerariesSnap.forEach((doc) => {
        const data = doc.data();
        matchedItinerary = {
          id: doc.id,
          packageId: data.packageId,
          packageName: data.packageName,
          departureDate: data.departureDate,
          returnDate: data.returnDate,
          tourLeaderName: data.tourLeaderName,
          tourLeaderId: data.tourLeaderId,
          days: data.days || [],
          status: data.status,
        };
      });

      console.log('✅ Itinerary found:', matchedItinerary?.packageName);
      setItinerary(matchedItinerary);
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      setItinerary(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat jadwal...</p>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Jadwal Belum Tersedia
          </h2>
          <p className="text-gray-600 mb-6">
            Jadwal keberangkatan Anda belum dibuat oleh admin. Silakan hubungi admin untuk informasi lebih lanjut.
          </p>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const selectedDayData = itinerary.days.find((d) => d.dayNumber === selectedDay);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center gap-2 text-white/90 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Kembali ke Dashboard</span>
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-white">
              <h1 className="text-3xl font-bold mb-2">{itinerary.packageName}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(itinerary.departureDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {new Date(itinerary.returnDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {itinerary.tourLeaderName && (
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Tour Leader: {itinerary.tourLeaderName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{itinerary.days.length} Hari</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Days List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 sticky top-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#D4AF37]" />
                Pilih Hari
              </h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {itinerary.days.map((day) => (
                  <button
                    key={day.dayNumber}
                    onClick={() => setSelectedDay(day.dayNumber)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      selectedDay === day.dayNumber
                        ? 'bg-gradient-to-r from-[#C5A572] to-[#D4AF37] text-white shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">
                      Hari {day.dayNumber}
                    </div>
                    <div className={`text-xs truncate ${selectedDay === day.dayNumber ? 'text-white/90' : 'text-gray-500'}`}>
                      {day.title}
                    </div>
                    {day.date && (
                      <div className={`text-xs mt-1 ${selectedDay === day.dayNumber ? 'text-white/80' : 'text-gray-400'}`}>
                        {new Date(day.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Day Details */}
          <div className="lg:col-span-3">
            {selectedDayData ? (
              <motion.div
                key={selectedDay}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-md border border-gray-200 p-6"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Hari {selectedDayData.dayNumber}: {selectedDayData.title}
                  </h2>
                  {selectedDayData.date && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#D4AF37]" />
                      {new Date(selectedDayData.date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>

                {/* Activities */}
                <div className="space-y-4">
                  {selectedDayData.activities.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">
                        Belum ada aktivitas untuk hari ini
                      </p>
                    </div>
                  ) : (
                    selectedDayData.activities.map((activity, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#C5A572] to-[#D4AF37] rounded-xl flex items-center justify-center shadow-md">
                              <Clock className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg font-bold text-[#D4AF37]">
                                {activity.time}
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-900 mb-2 text-lg">
                              {activity.activity}
                            </h4>
                            {activity.location && (
                              <p className="text-gray-600 flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span>{activity.location}</span>
                              </p>
                            )}
                            {activity.description && (
                              <p className="text-gray-700 text-sm bg-white rounded-lg p-3 mt-3 border border-gray-100">
                                {activity.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 text-center">
                <Info className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Pilih hari untuk melihat detail jadwal</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ❌ REMOVED: Feedback Dialog - Feedback now only available for Alumni */}
    </div>
  );
};

export default JamaahItineraryPage;