import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  Send,
  Users,
  Bell,
  CheckCircle,
  Clock,
  Trash2
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { useAuth } from '../../../../contexts/AuthContext';

interface Message {
  id: string;
  title: string;
  content: string;
  type: 'announcement' | 'reminder' | 'update';
  priority: 'low' | 'normal' | 'high';
  sentBy: string;
  sentByName: string;
  sentAt: string;
  recipients: 'all' | 'specific';
  recipientIds?: string[];
  readBy?: string[];
}

const CommunicationSection: React.FC = () => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'announcement' as Message['type'],
    priority: 'normal' as Message['priority'],
    recipients: 'all' as Message['recipients'],
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'tourLeaderMessages'),
        orderBy('sentAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const messagesData: Message[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Message));

      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Gagal memuat pesan');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Harap isi semua kolom');
      return;
    }

    setSendingMessage(true);

    try {
      const newMessage: Omit<Message, 'id'> = {
        ...formData,
        sentBy: userProfile?.uid || '',
        sentByName: userProfile?.displayName || 'Tour Leader',
        sentAt: new Date().toISOString(),
        readBy: [],
      };

      await addDoc(collection(db, 'tourLeaderMessages'), newMessage);

      toast.success('Pesan berhasil dikirim!', {
        description: `Pesan ${formData.type === 'announcement' ? 'pengumuman' : formData.type === 'reminder' ? 'pengingat' : 'pembaruan'} Anda telah dikirim ke semua anggota jamaah.`
      });

      // Reset form
      setFormData({
        title: '',
        content: '',
        type: 'announcement',
        priority: 'normal',
        recipients: 'all',
      });

      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Gagal mengirim pesan');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return;

    try {
      await deleteDoc(doc(db, 'tourLeaderMessages', id));
      toast.success('Pesan dihapus');
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Gagal menghapus pesan');
    }
  };

  const getTypeIcon = (type: Message['type']) => {
    switch (type) {
      case 'announcement':
        return <Bell className="w-5 h-5" />;
      case 'reminder':
        return <Clock className="w-5 h-5" />;
      case 'update':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: Message['type']) => {
    switch (type) {
      case 'announcement':
        return 'bg-blue-100 text-blue-700';
      case 'reminder':
        return 'bg-amber-100 text-amber-700';
      case 'update':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityBadge = (priority: Message['priority']) => {
    const config = {
      high: { bg: 'bg-red-100', text: 'text-red-700', label: 'Prioritas Tinggi' },
      normal: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Normal' },
      low: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Prioritas Rendah' },
    };

    const { bg, text, label } = config[priority];

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 text-sm">Memuat pesan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Send Message Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Kirim Pesan</h2>
              <p className="text-white/90 text-sm">Berkomunikasi dengan jamaah Anda</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSendMessage} className="p-6 space-y-5">
          {/* Message Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Pesan
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Message['type'] })}
              className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 focus:outline-none"
            >
              <option value="announcement">📢 Pengumuman</option>
              <option value="reminder">⏰ Pengingat</option>
              <option value="update">✅ Pembaruan</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioritas
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Message['priority'] })}
              className="w-full h-12 px-4 bg-white border border-gray-300 rounded-xl focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 focus:outline-none"
            >
              <option value="low">🔵 Prioritas Rendah</option>
              <option value="normal">⚪ Normal</option>
              <option value="high">🔴 Prioritas Tinggi</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul
            </label>
            <Input
              type="text"
              placeholder="contoh: Penting: Pertemuan jam 7 malam"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="h-12"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Isi Pesan
            </label>
            <textarea
              placeholder="Ketik pesan Anda di sini..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-xl focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 focus:outline-none resize-none"
              required
            />
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kirim Ke
            </label>
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Users className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Semua Anggota Jamaah</p>
                <p className="text-xs text-blue-700">Pesan ini akan dikirim ke semua orang di grup Anda</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={sendingMessage}
            className="w-full h-12 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white shadow-lg font-semibold"
          >
            {sendingMessage ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Mengirim...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Kirim Pesan
              </span>
            )}
          </Button>
        </form>
      </div>

      {/* Message History */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Riwayat Pesan</h2>
              <p className="text-white/90 text-sm">{messages.length} pesan terkirim</p>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[600px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Belum ada pesan</p>
              <p className="text-sm text-gray-500 mt-1">Pesan yang Anda kirim akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(message.type)}`}>
                        {getTypeIcon(message.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{message.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(message.type)}`}>
                            {message.type === 'announcement' ? 'Pengumuman' : message.type === 'reminder' ? 'Pengingat' : 'Pembaruan'}
                          </span>
                          {getPriorityBadge(message.priority)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                      title="Hapus pesan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 text-sm leading-relaxed mb-3 ml-13">
                    {message.content}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 ml-13">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(message.sentAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      <span>Dikirim ke semua jamaah</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunicationSection;
