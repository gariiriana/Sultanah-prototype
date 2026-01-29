import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import {
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Search,
  Eye,
  FileText,
  Download
} from 'lucide-react';

interface AlumniUpgradeRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  umrahDate: string;
  umrahProof: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: any;
  reviewedBy?: string;
  reviewDate?: any;
  rejectionReason?: string;
}

const AlumniUpgradeRequestsManagement = () => {
  const [requests, setRequests] = useState<AlumniUpgradeRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AlumniUpgradeRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AlumniUpgradeRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'alumniUpgradeRequests'), orderBy('requestDate', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AlumniUpgradeRequest[];
      
      setRequests(requestsData);
      setFilteredRequests(requestsData);
    });

    return () => unsubscribe();
  }, []);

  // Filter requests based on search and status
  useEffect(() => {
    let filtered = requests;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.userPhone.includes(searchTerm)
      );
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, requests]);

  const handleApprove = async (request: AlumniUpgradeRequest) => {
    setLoading(true);
    try {
      // Update upgrade request status
      await updateDoc(doc(db, 'alumniUpgradeRequests', request.id), {
        status: 'approved',
        reviewDate: serverTimestamp(),
        reviewedBy: 'admin'
      });

      // Update user role to alumni
      await updateDoc(doc(db, 'users', request.userId), {
        role: 'alumni',
        updatedAt: serverTimestamp()
      });

      toast.success(`${request.userName} upgraded to Alumni!`);
      setShowDetailDialog(false);
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'alumniUpgradeRequests', selectedRequest.id), {
        status: 'rejected',
        reviewDate: serverTimestamp(),
        reviewedBy: 'admin',
        rejectionReason: rejectionReason.trim()
      });

      toast.success('Request rejected');
      setShowRejectDialog(false);
      setShowDetailDialog(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300'
    };

    const labels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Alumni Upgrade Requests</h2>
        <p className="text-gray-600 mt-1">Manage upgrade requests from Current Jamaah to Alumni</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Trophy className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                size="sm"
                className={statusFilter === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('approved')}
                size="sm"
                className={statusFilter === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('rejected')}
                size="sm"
                className={statusFilter === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Alumni Upgrade Requests ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No alumni upgrade requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{request.userName}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {request.userEmail}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {request.userPhone}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Umrah: {request.umrahDate}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {formatDate(request.requestDate)}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </div>

                    {/* Action Buttons - Show for Pending requests */}
                    {request.status === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowRejectDialog(true);
                          }}
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          disabled={loading}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Approving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Show rejection reason if rejected */}
                    {request.status === 'rejected' && request.rejectionReason && (
                      <div className="pt-2 border-t">
                        <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-red-900">Rejection Reason:</p>
                              <p className="text-xs text-red-800 mt-1">{request.rejectionReason}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show review date if approved */}
                    {request.status === 'approved' && request.reviewDate && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          Approved on {formatDate(request.reviewDate)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D4AF37]" />
              Alumni Upgrade Request Details
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex justify-center">
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* Request Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <User className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Nama Lengkap</p>
                    <p className="font-semibold">{selectedRequest.userName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedRequest.userEmail}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">No WhatsApp</p>
                    <p className="font-semibold">{selectedRequest.userPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Umrah Date</p>
                    <p className="font-semibold">{selectedRequest.umrahDate}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <p className="text-sm font-medium text-gray-700">Proof of Umrah</p>
                  </div>
                  {selectedRequest.umrahProof && (
                    <div className="mt-2">
                      {selectedRequest.umrahProof.startsWith('data:application/pdf') ? (
                        <a
                          href={selectedRequest.umrahProof}
                          download="umrah-proof.pdf"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </a>
                      ) : (
                        <img
                          src={selectedRequest.umrahProof}
                          alt="Umrah Proof"
                          className="max-w-full h-auto rounded-lg border"
                        />
                      )}
                    </div>
                  )}
                </div>

                {selectedRequest.notes && (
                  <div className="p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <p className="text-sm font-medium text-gray-700">Additional Notes</p>
                    </div>
                    <p className="text-gray-900">{selectedRequest.notes}</p>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <Clock className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Request Date</p>
                    <p className="font-semibold">{formatDate(selectedRequest.requestDate)}</p>
                  </div>
                </div>

                {selectedRequest.reviewDate && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Reviewed Date</p>
                      <p className="font-semibold">{formatDate(selectedRequest.reviewDate)}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.rejectionReason && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900">Rejection Reason</p>
                        <p className="text-sm text-red-800 mt-1">{selectedRequest.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons (Only for pending requests) */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectDialog(true);
                    }}
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    disabled={loading}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Alumni Upgrade Request
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Rejection Reason <span className="text-red-500">*</span></Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirm Reject
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlumniUpgradeRequestsManagement;
