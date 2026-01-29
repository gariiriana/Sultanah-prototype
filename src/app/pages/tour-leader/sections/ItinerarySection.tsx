import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../../config/firebase';

interface ItineraryItem {
  id: string;
  day: number;
  date: string;
  time: string;
  title: string;
  location: string;
  description: string;
  notes?: string;
  completed?: boolean;
}

const ItinerarySection: React.FC = () => {
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    day: 1,
    date: '',
    time: '',
    title: '',
    location: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    fetchItinerary();
  }, []);

  const fetchItinerary = async () => {
    try {
      setLoading(true);
      // TODO: Filter by tour leader's active trip
      const q = query(
        collection(db, 'itinerary'),
        orderBy('day', 'asc'),
        orderBy('time', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const items: ItineraryItem[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ItineraryItem));
      
      setItineraryItems(items);
    } catch (error) {
      console.error('Error fetching itinerary:', error);
      toast.error('Failed to load itinerary');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update existing item
        await updateDoc(doc(db, 'itinerary', editingId), formData);
        toast.success('Itinerary updated successfully!');
      } else {
        // Add new item
        await addDoc(collection(db, 'itinerary'), {
          ...formData,
          completed: false,
          createdAt: new Date().toISOString(),
        });
        toast.success('Itinerary item added successfully!');
      }
      
      resetForm();
      fetchItinerary();
    } catch (error) {
      console.error('Error saving itinerary:', error);
      toast.error('Failed to save itinerary');
    }
  };

  const handleEdit = (item: ItineraryItem) => {
    setFormData({
      day: item.day,
      date: item.date,
      time: item.time,
      title: item.title,
      location: item.location,
      description: item.description,
      notes: item.notes || '',
    });
    setEditingId(item.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this itinerary item?')) return;
    
    try {
      await deleteDoc(doc(db, 'itinerary', id));
      toast.success('Itinerary item deleted!');
      fetchItinerary();
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      toast.error('Failed to delete itinerary item');
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      await updateDoc(doc(db, 'itinerary', id), { completed: !completed });
      fetchItinerary();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      day: 1,
      date: '',
      time: '',
      title: '',
      location: '',
      description: '',
      notes: '',
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  // Group items by day
  const groupedByDay = itineraryItems.reduce((acc, item) => {
    if (!acc[item.day]) acc[item.day] = [];
    acc[item.day].push(item);
    return acc;
  }, {} as Record<number, ItineraryItem[]>);

  const days = Object.keys(groupedByDay).map(Number).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Trip Itinerary</h2>
              <p className="text-white/90 text-sm">{days.length} days planned</p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all"
          >
            {showAddForm ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-gray-200 bg-gray-50"
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
                    className="h-12"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="h-12"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="h-12"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Visit Masjid Nabawi"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-12"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Madinah"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="h-12"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Detailed description of the activity..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-xl focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 focus:outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="Additional notes or reminders"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white"
                >
                  {editingId ? 'Update Item' : 'Add Item'}
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="outline"
                  className="h-12 px-6"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Itinerary Timeline */}
      <div className="p-6">
        {days.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No itinerary items yet</p>
            <p className="text-sm text-gray-500 mt-1">Click "Add Item" to create your first itinerary entry</p>
          </div>
        ) : (
          <div className="space-y-6">
            {days.map((day) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                {/* Day Header */}
                <button
                  onClick={() => setExpandedDay(expandedDay === day ? null : day)}
                  className="w-full bg-gradient-to-r from-gray-50 to-gray-100 p-4 flex items-center justify-between hover:from-gray-100 hover:to-gray-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#C5A572] to-[#D4AF37] rounded-lg flex items-center justify-center text-white font-bold">
                      {day}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">Day {day}</h3>
                      <p className="text-sm text-gray-600">{groupedByDay[day].length} activities</p>
                    </div>
                  </div>
                  
                  {expandedDay === day ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {/* Day Items */}
                <AnimatePresence>
                  {expandedDay === day && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-4 bg-white">
                        {groupedByDay[day].map((item, index) => (
                          <div
                            key={item.id}
                            className={`relative pl-8 pb-6 ${
                              index === groupedByDay[day].length - 1 ? '' : 'border-l-2 border-gray-200 ml-2'
                            }`}
                          >
                            {/* Timeline Dot */}
                            <div 
                              className={`absolute left-0 top-0 w-4 h-4 rounded-full border-2 -ml-2 ${
                                item.completed 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'bg-white border-gray-300'
                              }`}
                            />

                            <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow">
                              {/* Time and Location */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-medium">{item.time}</span>
                                    <span>•</span>
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                  </div>
                                  <h4 className="font-semibold text-gray-900 text-lg">{item.title}</h4>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{item.location}</span>
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleToggleComplete(item.id, item.completed || false)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      item.completed
                                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                    title={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Description */}
                              <p className="text-gray-700 text-sm leading-relaxed mb-2">
                                {item.description}
                              </p>

                              {/* Notes */}
                              {item.notes && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                  <p className="text-sm text-amber-800">
                                    <span className="font-medium">Note:</span> {item.notes}
                                  </p>
                                </div>
                              )}

                              {/* Status Badge */}
                              {item.completed && (
                                <div className="mt-3">
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                    <Check className="w-3 h-3" />
                                    Completed
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItinerarySection;
