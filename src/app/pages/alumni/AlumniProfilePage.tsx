import React from 'react';
import ProfileForm from '../prospective-jamaah/ProfileForm';
import { useAuth } from '../../../contexts/AuthContext';

interface AlumniProfilePageProps {
  onBack: () => void;
}

const AlumniProfilePage: React.FC<AlumniProfilePageProps> = ({ onBack }) => {
  const { userProfile, currentUser } = useAuth();

  return (
    <ProfileForm 
      userProfile={userProfile} 
      currentUser={currentUser} 
      onBack={onBack}
    />
  );
};

export default AlumniProfilePage;
