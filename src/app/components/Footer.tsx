import React from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react';

interface FooterProps {
  onNavigate: (section: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Beranda', section: 'home' },
    { label: 'Paket', section: 'packages' },
    { label: 'Edukasi', section: 'education' },
    { label: 'Kontak', section: 'contact' },
  ];

  const socialLinks = [
    { icon: Facebook, link: '#', label: 'Facebook' },
    { icon: Instagram, link: '#', label: 'Instagram' },
    { icon: Twitter, link: '#', label: 'Twitter' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <img
                src="/images/logo.png"
                alt="Sultanah Travel"
                className="h-20 w-auto object-contain rounded-xl"
              />
            </div>
            <p className="text-gray-400 mb-4">
              Mitra terpercaya Anda untuk perjalanan Umrah dan wisata halal. Rasakan perjalanan spiritual seumur hidup dengan layanan premium dan bimbingan ahli kami.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.link}
                    aria-label={social.label}
                    className="w-10 h-10 bg-white/10 hover:bg-[#D4AF37] rounded-full flex items-center justify-center transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4">Tautan Cepat</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => onNavigate(link.section)}
                    className="text-gray-400 hover:text-[#FFD700] transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4">Hubungi Kami</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-[#D4AF37]" />
                <span>+62 812-3470-0116</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-[#D4AF37]" />
                <span>info@sultanahtravel.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} Sultanah Travel. Hak Cipta Dilindungi.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;