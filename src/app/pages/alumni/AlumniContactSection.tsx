import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Phone, Mail, MapPin, Send, Clock3 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface AlumniContactSectionProps {
  contactForm: ContactFormData;
  setContactForm: React.Dispatch<React.SetStateAction<ContactFormData>>;
  sendingMessage: boolean;
  setSendingMessage: React.Dispatch<React.SetStateAction<boolean>>;
}

const AlumniContactSection: React.FC<AlumniContactSectionProps> = ({
  contactForm,
  setContactForm,
  sendingMessage,
  setSendingMessage,
}) => {
  const handleSendMessage = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.phone || !contactForm.message) {
      toast.error('Mohon lengkapi semua field');
      return;
    }
    setSendingMessage(true);
    setTimeout(() => {
      toast.success('Pesan berhasil dikirim! Kami akan segera menghubungi Anda.');
      setContactForm({ name: '', email: '', phone: '', message: '' });
      setSendingMessage(false);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-[#D4AF37]/20 to-[#C5A572]/20 rounded-full mb-4">
          <span className="text-sm font-medium text-[#D4AF37]">Hubungi Kami</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Mari <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">Berdiskusi</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Ada pertanyaan? Tim kami siap membantu Anda merencanakan perjalanan spiritual yang sempurna
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        
        {/* Left: Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="shadow-xl border-2 border-[#D4AF37]/10">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Kirim Pesan</h3>
                  <p className="text-sm text-gray-600">Isi formulir di bawah ini dan kami akan segera menghubungi Anda</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="contact-name">Nama Lengkap</Label>
                  <Input
                    id="contact-name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    placeholder="Ahmad Hidayat"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-email">Alamat Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    placeholder="ahmad@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-phone">Nomor Telepon</Label>
                  <Input
                    id="contact-phone"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    placeholder="+62 812-3456-7890"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-message">Pesan</Label>
                  <Textarea
                    id="contact-message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    placeholder="Ceritakan kepada kami tentang rencana perjalanan Anda dan pertanyaan yang ingin diajukan..."
                    rows={5}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={sendingMessage}
                  className="w-full bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white font-semibold py-6"
                >
                  {sendingMessage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Kirim Pesan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Contact Info Cards */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          {/* WhatsApp */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <MessageCircle className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">WhatsApp</h3>
                  <p className="text-lg font-semibold text-green-700 mb-0.5">+62 857-2337-5324</p>
                  <p className="text-sm text-green-600">Respon cepat 24/7</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Telepon */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Phone className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Telepon</h3>
                  <p className="text-lg font-semibold text-blue-700 mb-0.5">+62 21 1234 5678</p>
                  <p className="text-sm text-blue-600">Senin-Jumat 09:00-18:00</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-200 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Mail className="w-7 h-7 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Email</h3>
                  <p className="text-lg font-semibold text-orange-700 mb-0.5">info@sultanahtravel.com</p>
                  <p className="text-sm text-orange-600">Balas dalam 24 jam</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kantor */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200 hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <MapPin className="w-7 h-7 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">Kantor</h3>
                  <p className="text-lg font-semibold text-purple-700 mb-0.5">Jakarta, Indonesia</p>
                  <p className="text-sm text-purple-600">Kunjungi untuk konsultasi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jam Operasional */}
          <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-[#F4D03F]/10 border-2 border-[#D4AF37]/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <Clock3 className="w-7 h-7 text-[#D4AF37]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">Jam Operasional</h3>
                </div>
              </div>
              <div className="space-y-2 pl-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Senin - Jumat</span>
                  <span className="font-semibold text-[#D4AF37]">09:00 - 18:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Sabtu</span>
                  <span className="font-semibold text-[#D4AF37]">09:00 - 14:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Minggu</span>
                  <span className="font-semibold text-red-600">Tutup</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AlumniContactSection;
