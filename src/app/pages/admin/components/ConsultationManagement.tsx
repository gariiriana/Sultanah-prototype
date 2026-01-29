import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { MessageCircle, Phone, Mail, Calendar, Package, Gift, User, CheckCircle2, XCircle, PhoneCall } from 'lucide-react';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { toast } from 'sonner';
import { Consultation } from '../../../../types';

const ConsultationManagement = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'consultations'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const consultationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Consultation[];
      
      setConsultations(consultationsData);
    } catch (error: any) {
      console.error('Error fetching consultations:', error);
      
      // If permission denied, show helpful message
      if (error?.code === 'permission-denied') {
        toast.error('⚠️ Firestore Rules Belum Di-Deploy!', {
          duration: 10000,
          description: 'Silakan deploy rules di Firebase Console terlebih dahulu. Lihat file CARA_DEPLOY_FIRESTORE_RULES.md',
        });
      } else {
        toast.error('Gagal memuat data konsultasi');
      }
      
      // Set empty array so UI still renders
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (consultationId: string, status: Consultation['status']) => {
    try {
      const consultationRef = doc(db, 'consultations', consultationId);
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString(),
      };

      if (status === 'contacted') {
        updateData.contactedAt = new Date().toISOString();
      } else if (status === 'converted') {
        updateData.convertedAt = new Date().toISOString();
      }

      await updateDoc(consultationRef, updateData);
      
      toast.success('Status konsultasi berhasil diupdate!');
      fetchConsultations();
      setDetailDialogOpen(false);
    } catch (error) {
      console.error('Error updating consultation:', error);
      toast.error('Gagal update status konsultasi');
    }
  };

  const handleSaveNotes = async (consultationId: string) => {
    try {
      const consultationRef = doc(db, 'consultations', consultationId);
      await updateDoc(consultationRef, {
        notes: notes,
        updatedAt: new Date().toISOString(),
      });
      
      toast.success('Catatan berhasil disimpan!');
      fetchConsultations();
      setDetailDialogOpen(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Gagal menyimpan catatan');
    }
  };

  const getStatusBadge = (status: Consultation['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-500">Dihubungi</Badge>;
      case 'converted':
        return <Badge className="bg-green-500">Converted</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: 'package' | 'promo') => {
    return type === 'package' ? (
      <Badge variant="outline" className="border-[#D4AF37] text-[#D4AF37]">
        <Package className="w-3 h-3 mr-1" />
        Package
      </Badge>
    ) : (
      <Badge variant="outline" className="border-green-500 text-green-600">
        <Gift className="w-3 h-3 mr-1" />
        Promo
      </Badge>
    );
  };

  const openWhatsApp = (phone: string, name: string, itemName: string) => {
    const message = `Halo ${name}, terima kasih atas minat Anda pada ${itemName}. Ada yang bisa kami bantu?`;
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data konsultasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
          Consultation Tracker
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Kelola konsultasi dari customer yang klik "Konsultasi Gratis"
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">
                {consultations.filter(c => c.status === 'pending').length}
              </p>
            </div>
            <MessageCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dihubungi</p>
              <p className="text-2xl font-bold text-blue-700">
                {consultations.filter(c => c.status === 'contacted').length}
              </p>
            </div>
            <PhoneCall className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Converted</p>
              <p className="text-2xl font-bold text-green-700">
                {consultations.filter(c => c.status === 'converted').length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-700">
                {consultations.length}
              </p>
            </div>
            <User className="w-8 h-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="border rounded-xl overflow-hidden shadow-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-[#FFF9F0] to-white">
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consultations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Belum ada konsultasi</p>
                </TableCell>
              </TableRow>
            ) : (
              consultations.map((consultation) => (
                <TableRow key={consultation.id} className="hover:bg-[#FFF9F0]/30 transition-colors">
                  <TableCell>
                    <div>
                      <p className="font-medium">{consultation.userName}</p>
                      <p className="text-xs text-gray-500">{consultation.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(consultation.type)}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {consultation.itemName}
                  </TableCell>
                  <TableCell>
                    {consultation.userPhone ? (
                      <span className="text-sm font-mono">{consultation.userPhone}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(consultation.status)}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(consultation.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedConsultation(consultation);
                          setNotes(consultation.notes || '');
                          setDetailDialogOpen(true);
                        }}
                      >
                        Detail
                      </Button>
                      
                      {consultation.userPhone && (
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => openWhatsApp(
                            consultation.userPhone!,
                            consultation.userName,
                            consultation.itemName
                          )}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-white via-[#FFF9F0] to-white backdrop-blur-xl border-2 border-[#D4AF37]/30 shadow-2xl">
          <DialogHeader className="border-b border-[#D4AF37]/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#FFD700] flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A572] bg-clip-text text-transparent">
                  Detail Konsultasi
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Kelola konsultasi customer
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedConsultation && (
            <div className="space-y-6 py-4">
              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D4AF37]" />
                  Informasi Customer
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Nama</p>
                    <p className="font-medium">{selectedConsultation.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-sm">{selectedConsultation.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">
                      {selectedConsultation.userPhone || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedConsultation.status)}</div>
                  </div>
                </div>
              </div>

              {/* Consultation Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  {selectedConsultation.type === 'package' ? (
                    <Package className="w-4 h-4 text-[#D4AF37]" />
                  ) : (
                    <Gift className="w-4 h-4 text-green-500" />
                  )}
                  Informasi Konsultasi
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-white/50 p-4 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <div className="mt-1">{getTypeBadge(selectedConsultation.type)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Item</p>
                    <p className="font-medium">{selectedConsultation.itemName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created At</p>
                    <p className="text-sm">
                      {new Date(selectedConsultation.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  {selectedConsultation.contactedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Contacted At</p>
                      <p className="text-sm">
                        {new Date(selectedConsultation.contactedAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Catatan Admin</h4>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan tentang konsultasi ini..."
                  className="min-h-[100px]"
                />
                <Button
                  onClick={() => handleSaveNotes(selectedConsultation.id)}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C5A572] hover:from-[#C5A572] hover:to-[#D4AF37]"
                >
                  Simpan Catatan
                </Button>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">Update Status</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={() => handleUpdateStatus(selectedConsultation.id, 'contacted')}
                    disabled={selectedConsultation.status === 'contacted'}
                  >
                    <PhoneCall className="w-4 h-4 mr-2" />
                    Sudah Dihubungi
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="border-green-300 text-green-600 hover:bg-green-50"
                    onClick={() => handleUpdateStatus(selectedConsultation.id, 'converted')}
                    disabled={selectedConsultation.status === 'converted'}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Converted
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleUpdateStatus(selectedConsultation.id, 'cancelled')}
                    disabled={selectedConsultation.status === 'cancelled'}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelled
                  </Button>

                  {selectedConsultation.userPhone && (
                    <Button
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => openWhatsApp(
                        selectedConsultation.userPhone!,
                        selectedConsultation.userName,
                        selectedConsultation.itemName
                      )}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsultationManagement;