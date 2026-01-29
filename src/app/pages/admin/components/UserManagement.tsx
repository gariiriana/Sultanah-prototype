import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { toast } from 'sonner';
import { User } from '../../../../types';
import UserDocumentsModal from './UserDocumentsModal';

// Helper function to calculate document completion
const calculateDocumentCompletion = (user: User) => {
  if (!user.travelDocuments) return { status: 'Incomplete', percentage: 0 };
  
  const requiredDocs = [
    user.travelDocuments.passportPhoto,
    user.travelDocuments.ktpPhoto,
    user.travelDocuments.kkPhoto,
    user.travelDocuments.birthCertificate,
    user.travelDocuments.umrahVisa,
    user.travelDocuments.flightTicket,
    user.travelDocuments.vaccinationCertificate,
  ];
  
  const uploadedCount = requiredDocs.filter(doc => !!doc).length;
  const totalRequired = requiredDocs.length;
  const percentage = Math.round((uploadedCount / totalRequired) * 100);
  
  if (percentage === 100) return { status: 'Complete', percentage, count: `${uploadedCount}/${totalRequired}` };
  if (percentage > 0) return { status: 'Pending', percentage, count: `${uploadedCount}/${totalRequired}` };
  return { status: 'Incomplete', percentage: 0, count: '0/7' };
};

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData.filter(u => u.role !== 'admin'));
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const handleApproveDocuments = async (userId: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        documentsApproved: approved,
      });
      toast.success(`Documents ${approved ? 'approved' : 'rejected'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleViewDocuments = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  return (
    <div>
      <h3 className="text-xl mb-6">User Management</h3>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Profile Complete</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const docStatus = calculateDocumentCompletion(user);
              
              return (
                <TableRow key={user.id}>
                  <TableCell>{user.displayName || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={user.profileComplete ? 'default' : 'secondary'}>
                      {user.profileComplete ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge 
                        variant={
                          docStatus.status === 'Complete' ? 'default' : 
                          docStatus.status === 'Pending' ? 'secondary' : 
                          'destructive'
                        }
                        className={
                          docStatus.status === 'Complete' ? 'bg-green-600' :
                          docStatus.status === 'Pending' ? 'bg-yellow-600' :
                          'bg-red-600'
                        }
                      >
                        {docStatus.status}
                      </Badge>
                      <span className="text-xs text-gray-500">{docStatus.count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {!user.documentsApproved && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => handleApproveDocuments(user.id, true)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() => handleApproveDocuments(user.id, false)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600"
                        onClick={() => handleViewDocuments(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found</p>
        </div>
      )}

      <UserDocumentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
      />
    </div>
  );
};

export default UserManagement;