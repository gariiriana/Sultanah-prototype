import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, Clock, MessageCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Pesan terkirim! Kami akan segera menghubungi Anda.');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  const contactInfo = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      content: '+62 812-3470-0116',
      description: 'Respon cepat 24/7',
      link: 'https://api.whatsapp.com/send/?phone=6281234700116&text=Halo%20Sultanah%20Travel%2C%20saya%20ingin%20bertanya&type=phone_number&app_absent=0',
      color: 'from-green-500/10 to-green-600/10',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    {
      icon: Phone,
      title: 'Telepon',
      content: '+62 21 1234 5678',
      description: 'Senin-Jumat 09:00-18:00',
      link: 'tel:+622112345678',
      color: 'from-blue-500/10 to-blue-600/10',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'info@sultanahtravel.com',
      description: 'Balas dalam 24 jam',
      link: 'mailto:info@sultanahtravel.com',
      color: 'from-amber-500/10 to-amber-600/10',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200',
    },
    {
      icon: MapPin,
      title: 'Kantor',
      content: 'Jakarta, Indonesia',
      description: 'Kunjungi untuk konsultasi',
      link: '#',
      color: 'from-purple-500/10 to-purple-600/10',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1578008086519-8e0e73b57e9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrYWFiYSUyMHBpbGdyaW1zfGVufDF8fHx8MTc2ODE4NTg3N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Kaaba with Pilgrims"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/75 via-violet-900/65 to-purple-900/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/90 to-white/95" />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating Orbs */}
      <motion.div
        animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-40 left-10 w-64 h-64 bg-gradient-to-br from-indigo-300/20 to-violet-400/20 rounded-full blur-3xl z-0"
      />
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-40 right-10 w-56 h-56 bg-gradient-to-tl from-purple-300/20 to-pink-400/20 rounded-full blur-3xl z-0"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block mb-4"
          >
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37]/10 to-[#FFD700]/10 border border-[#D4AF37]/20 text-[#D4AF37] font-medium text-sm">
              Hubungi Kami
            </span>
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-light mb-4">
            Mari <span className="font-semibold bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] bg-clip-text text-transparent">Berdiskusi</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Ada pertanyaan? Tim kami siap membantu Anda merencanakan perjalanan spiritual yang sempurna
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative p-8 rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F]" />

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#FFD700]/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900">Kirim Pesan</h3>
                </div>
                <p className="text-gray-600">Isi formulir di bawah ini dan kami akan segera menghubungi Anda</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ahmad Hidayat"
                    className="h-12 border-gray-300 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5">Alamat Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ahmad@example.com"
                    className="h-12 border-gray-300 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+62 812-3456-7890"
                    className="h-12 border-gray-300 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-1.5">Pesan</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Ceritakan kepada kami tentang rencana perjalanan Anda dan pertanyaan yang ingin diajukan..."
                    rows={5}
                    className="border-gray-300 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 rounded-xl resize-none"
                    required
                  />
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-[#C5A572] via-[#D4AF37] to-[#F4D03F] hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-semibold"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Kirim Pesan
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* Contact Cards */}
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <a href={info.link} className="block">
                    <div className={`relative p-6 rounded-2xl bg-gradient-to-br ${info.color} border ${info.borderColor} hover:border-[#D4AF37]/40 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group`}>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative flex items-start gap-4">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          className="flex-shrink-0 w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-md"
                        >
                          <Icon className={`w-7 h-7 ${info.iconColor}`} />
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                          <p className="text-gray-900 font-medium mb-1">{info.content}</p>
                          <p className="text-sm text-gray-600">{info.description}</p>
                        </div>
                      </div>
                    </div>
                  </a>
                </motion.div>
              );
            })}

            {/* Business Hours Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-[#C5A572] via-[#D4AF37] to-[#F4D03F] text-white shadow-xl overflow-hidden">
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />
                </div>

                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold">Jam Operasional</h3>
                  </div>
                  <div className="space-y-2.5 text-white/90">
                    <div className="flex justify-between items-center py-2 border-b border-white/20">
                      <span className="font-medium">Senin - Jumat</span>
                      <span>09:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/20">
                      <span className="font-medium">Sabtu</span>
                      <span>09:00 - 14:00</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium">Minggu</span>
                      <span>Tutup</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;