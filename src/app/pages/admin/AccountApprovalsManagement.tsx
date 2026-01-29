import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Clock, Eye, FileText, Award } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { AccountApproval } from '../../../types';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { motion } from 'motion/react';
import { toast } from 'sonner';

const AccountApprovalsManagement: React.FC = () => {
  const [applications, setApplications] = useState<AccountApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AccountApproval['status'] | 'all'>('pending');
  const [selectedApp, setSelectedApp] = useState<AccountApproval | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const approvalsRef = collection(db, 'accountApprovals');
      const q = query(approvalsRef, orderBy('appliedAt', 'desc'));
      const snapshot = await getDocs(q);
      const appsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AccountApproval[];
      setApplications(appsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Gagal memuat aplikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId: string, userId: string, requestedRole: AccountApproval['requestedRole']) => {
    const notes = prompt('Catatan untuk applicant (opsional):');
    
    try {
      // Update application status
      await updateDoc(doc(db, 'accountApprovals', appId), {
        status: 'approved',
        reviewNotes: notes || undefined,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Update user role
      await updateDoc(doc(db, 'users', userId), {
        role: requestedRole
      });

      toast.success('Aplikasi disetujui! Role user telah diupdate.');
      fetchApplications();
      setSelectedApp(null);
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Gagal menyetujui aplikasi');
    }
  };

  const handleReject = async (appId: string) => {
    const reason = prompt('Alasan penolakan:');
    if (!reason) return;

    try {
      await updateDoc(doc(db, 'accountApprovals', appId), {
        status: 'rejected',
        rejectedReason: reason,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast.success('Aplikasi ditolak');
      fetchApplications();
      setSelectedApp(null);
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Gagal menolak aplikasi');
    }
  };

  const filteredApplications = applications.filter(app => 
    filterStatus === 'all' || app.status === filterStatus
  );

  const getStatusBadge = (status: AccountApproval['status']) => {
    const badges = {
      pending: { label: 'Menunggu Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
      approved: { label: 'Disetujui', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
    };
    return badges[status];
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        <p className="mt-4 text-gray-600">Memuat aplikasi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approval Akun Role Khusus</h1>
        <p className="text-gray-600 mt-1">Review dan approve aplikasi Tour Leader & Mutawwif</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Aplikasi</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Menunggu Review</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Disetujui</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ditolak</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex gap-2">
          {[
            { value: 'pending', label: 'Pending' },
            { value: 'all', label: 'Semua' },
            { value: 'approved', label: 'Disetujui' },
            { value: 'rejected', label: 'Ditolak' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value as AccountApproval['status'] | 'all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === filter.value
                  ? 'bg-gold text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada aplikasi ditemukan</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredApplications.map((app, index) => {
              const statusBadge = getStatusBadge(app.status);
              const StatusIcon = statusBadge.icon;

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="w-6 h-6 text-gold" />
                        <h3 className="font-bold text-gray-900 text-lg">{app.userName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${statusBadge.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusBadge.label}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Email:</span> {app.userEmail}
                        </div>
                        <div>
                          <span className="font-medium">Role yang Diajukan:</span>{' '}
                          <span className="capitalize font-semibold text-gold">
                            {app.requestedRole === 'tour-leader' ? 'Tour Leader' : 'Mutawwif'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Telepon:</span> {app.applicationData.phoneNumber}
                        </div>
                        <div>
                          <span className="font-medium">Tanggal Aplikasi:</span>{' '}
                          {new Date(app.appliedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>

                      {app.applicationData.experience && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Pengalaman:</span>{' '}
                          <span className="text-sm text-gray-600">{app.applicationData.experience}</span>
                        </div>
                      )}

                      {app.applicationData.languages && app.applicationData.languages.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Bahasa:</span>{' '}
                          <span className="text-sm text-gray-600">{app.applicationData.languages.join(', ')}</span>
                        </div>
                      )}

                      {app.reviewNotes && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900">
                            <span className="font-medium">Catatan Review:</span> {app.reviewNotes}
                          </p>
                        </div>
                      )}

                      {app.rejectedReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-900">
                            <span className="font-medium">Alasan Ditolak:</span> {app.rejectedReason}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => setSelectedApp(app)}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Detail
                      </Button>

                      {app.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleApprove(app.id, app.userId, app.requestedRole)}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Setujui
                          </Button>
                          <Button
                            onClick={() => handleReject(app.id)}
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50 gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Tolak
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Detail Aplikasi</h2>
              <Button onClick={() => setSelectedApp(null)} variant="ghost">✕</Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Data Pribadi</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nama Lengkap</p>
                    <p className="font-medium text-gray-900">{selectedApp.applicationData.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedApp.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telepon</p>
                    <p className="font-medium text-gray-900">{selectedApp.applicationData.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role yang Diajukan</p>
                    <p className="font-medium text-gold capitalize">
                      {selectedApp.requestedRole === 'tour-leader' ? 'Tour Leader' : 'Mutawwif'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Experience & Qualifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Pengalaman & Kualifikasi</h3>
                
                {selectedApp.applicationData.experience && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Pengalaman</p>
                    <p className="text-gray-900">{selectedApp.applicationData.experience}</p>
                  </div>
                )}

                {selectedApp.applicationData.certifications && selectedApp.applicationData.certifications.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Sertifikasi</p>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedApp.applicationData.certifications.map((cert, i) => (
                        <li key={i} className="text-gray-900">{cert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedApp.applicationData.languages && selectedApp.applicationData.languages.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Bahasa yang Dikuasai</p>
                    <p className="text-gray-900">{selectedApp.applicationData.languages.join(', ')}</p>
                  </div>
                )}

                {selectedApp.applicationData.specialization && selectedApp.applicationData.specialization.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Spesialisasi</p>
                    <p className="text-gray-900">{selectedApp.applicationData.specialization.join(', ')}</p>
                  </div>
                )}
              </div>

              {/* Motivation */}
              {selectedApp.applicationData.motivation && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Motivasi</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedApp.applicationData.motivation}</p>
                </div>
              )}

              {/* References */}
              {selectedApp.applicationData.references && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Referensi</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedApp.applicationData.references}</p>
                </div>
              )}

              {/* Documents */}
              {selectedApp.applicationData.documents && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Dokumen</h3>
                  <div className="space-y-3">
                    {selectedApp.applicationData.documents.cv && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span className="text-gray-700">CV / Resume tersedia</span>
                      </div>
                    )}
                    {selectedApp.applicationData.documents.idCard && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">KTP tersedia</span>
                      </div>
                    )}
                    {selectedApp.applicationData.documents.certificates && selectedApp.applicationData.documents.certificates.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-5 h-5 text-gold" />
                        <span className="text-gray-700">{selectedApp.applicationData.documents.certificates.length} Sertifikat tersedia</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedApp.status === 'pending' && (
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => handleApprove(selectedApp.id, selectedApp.userId, selectedApp.requestedRole)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Setujui Aplikasi
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedApp.id)}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-50 gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    Tolak Aplikasi
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AccountApprovalsManagement;
