import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Hospital,
  Shield,
  Users,
  Building,
  PhoneCall
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { toast } from 'sonner';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../config/firebase';

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  organization?: string;
  location?: string;
  type: 'medical' | 'security' | 'embassy' | 'local-guide' | 'tour-operator' | 'other';
  available24h?: boolean;
}

interface JamaahEmergency {
  id: string;
  jamaahName: string;
  emergencyName: string;
  emergencyPhone: string;
  relationship: string;
}

const EmergencyContactsSection: React.FC = () => {
  const [emergencyContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'Saudi Emergency Hotline',
      role: 'Emergency Services',
      phone: '997',
      type: 'security',
      available24h: true,
      organization: 'Saudi Arabia Government',
      location: 'Saudi Arabia'
    },
    {
      id: '2',
      name: 'Indonesian Embassy - Riyadh',
      role: 'Embassy',
      phone: '+966-11-488-2800',
      email: 'kbri.riyadh@kemlu.go.id',
      type: 'embassy',
      available24h: true,
      organization: 'KBRI Saudi Arabia',
      location: 'Riyadh'
    },
    {
      id: '3',
      name: 'Indonesian Consulate - Jeddah',
      role: 'Consulate',
      phone: '+966-12-667-0089',
      email: 'kjri.jeddah@kemlu.go.id',
      type: 'embassy',
      available24h: true,
      organization: 'KJRI Jeddah',
      location: 'Jeddah'
    },
    {
      id: '4',
      name: 'Red Crescent Makkah',
      role: 'Medical Emergency',
      phone: '997',
      type: 'medical',
      available24h: true,
      organization: 'Saudi Red Crescent',
      location: 'Makkah'
    },
    {
      id: '5',
      name: 'Red Crescent Madinah',
      role: 'Medical Emergency',
      phone: '997',
      type: 'medical',
      available24h: true,
      organization: 'Saudi Red Crescent',
      location: 'Madinah'
    },
  ]);

  const [jamaahEmergencyContacts, setJamaahEmergencyContacts] = useState<JamaahEmergency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJamaahEmergencyContacts();
  }, []);

  const fetchJamaahEmergencyContacts = async () => {
    try {
      setLoading(true);
      // Fetch all current-jamaah users and their emergency contacts
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'current-jamaah')
      );

      const querySnapshot = await getDocs(q);
      const contacts: JamaahEmergency[] = [];

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.emergencyContact) {
          contacts.push({
            id: doc.id,
            jamaahName: data.identityInfo?.fullName || data.displayName || 'Unknown',
            emergencyName: data.emergencyContact.name,
            emergencyPhone: data.emergencyContact.phone,
            relationship: data.emergencyContact.relationship,
          });
        }
      });

      setJamaahEmergencyContacts(contacts);
    } catch (error) {
      console.error('Error fetching jamaah emergency contacts:', error);
      toast.error('Gagal memuat kontak darurat jamaah');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: EmergencyContact['type']) => {
    switch (type) {
      case 'medical':
        return <Hospital className="w-5 h-5" />;
      case 'security':
        return <Shield className="w-5 h-5" />;
      case 'embassy':
        return <Building className="w-5 h-5" />;
      case 'local-guide':
        return <Users className="w-5 h-5" />;
      case 'tour-operator':
        return <MapPin className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: EmergencyContact['type']) => {
    switch (type) {
      case 'medical':
        return 'from-red-500 to-red-600';
      case 'security':
        return 'from-blue-500 to-blue-600';
      case 'embassy':
        return 'from-green-500 to-green-600';
      case 'local-guide':
        return 'from-amber-500 to-amber-600';
      case 'tour-operator':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

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
    <div className="space-y-6">
      {/* Main Emergency Contacts */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Kontak Darurat</h2>
              <p className="text-white/90 text-sm">Akses cepat ke nomor penting</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Background Gradient */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getTypeColor(contact.type)} opacity-5 rounded-bl-full`} />

                {/* Header */}
                <div className="relative flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(contact.type)} rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                    {getTypeIcon(contact.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{contact.name}</h3>
                    <p className="text-sm text-gray-600">{contact.role}</p>
                    {contact.organization && (
                      <p className="text-xs text-gray-500 mt-1">{contact.organization}</p>
                    )}
                  </div>
                  {contact.available24h && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      24/7
                    </span>
                  )}
                </div>

                {/* Contact Info */}
                <div className="relative space-y-3">
                  {/* Phone */}
                  <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">{contact.phone}</span>
                    </div>
                    <Button
                      onClick={() => handleCall(contact.phone)}
                      size="sm"
                      className={`ml-2 h-8 px-3 bg-gradient-to-r ${getTypeColor(contact.type)} hover:opacity-90 text-white shadow-md`}
                    >
                      <PhoneCall className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Email */}
                  {contact.email && (
                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{contact.email}</span>
                      </div>
                      <Button
                        onClick={() => handleEmail(contact.email!)}
                        size="sm"
                        variant="outline"
                        className="ml-2 h-8 px-3"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Location */}
                  {contact.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{contact.location}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Jamaah Emergency Contacts */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Kontak Darurat Jamaah</h2>
              <p className="text-white/90 text-sm">{jamaahEmergencyContacts.length} kontak tersedia</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {jamaahEmergencyContacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">Tidak ada kontak darurat tersedia</p>
              <p className="text-sm text-gray-500 mt-1">Jamaah belum menambahkan kontak darurat</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jamaahEmergencyContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  {/* Jamaah Name */}
                  <div className="mb-3 pb-3 border-b border-amber-200">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      {contact.jamaahName}
                    </h4>
                  </div>

                  {/* Emergency Contact Info */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Emergency Contact</p>
                      <p className="font-medium text-gray-900">{contact.emergencyName}</p>
                      <p className="text-xs text-gray-600 mt-1">({contact.relationship})</p>
                    </div>

                    <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-amber-200">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Phone className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">{contact.emergencyPhone}</span>
                      </div>
                      <a
                        href={`tel:${contact.emergencyPhone}`}
                        className="ml-2 p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-red-900 text-lg mb-2">Protokol Darurat</h3>
            <ul className="space-y-2 text-sm text-red-800">
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">1.</span>
                <span>Tetap tenang dan nilai situasi</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">2.</span>
                <span>Hubungi layanan darurat setempat (997) untuk bantuan segera</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">3.</span>
                <span>Hubungi Kedutaan/Konsulat Indonesia jika diperlukan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">4.</span>
                <span>Beritahu kontak darurat jamaah jika situasi melibatkan anggota</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold mt-0.5">5.</span>
                <span>Dokumentasikan detail kejadian untuk pelaporan</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactsSection;
