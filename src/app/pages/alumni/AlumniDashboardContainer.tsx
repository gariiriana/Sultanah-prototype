import React, { useState } from 'react';
import AlumniPortalScrollable from './AlumniPortalScrollable';
import AlumniProfilePage from './AlumniProfilePage';
import FloatingAnnouncementWidget from '../../components/FloatingAnnouncementWidget';

type ViewType = 'portal' | 'profile';

const AlumniDashboardContainer = () => {
  const [currentView, setCurrentView] = useState<ViewType>('portal');

  const renderView = () => {
    switch (currentView) {
      case 'portal':
        return (
          <AlumniPortalScrollable
            onNavigateToProfile={() => setCurrentView('profile')}
          />
        );
      case 'profile':
        return <AlumniProfilePage onBack={() => setCurrentView('portal')} />;
      default:
        return (
          <AlumniPortalScrollable
            onNavigateToProfile={() => setCurrentView('profile')}
          />
        );
    }
  };

  return (
    <>
      {renderView()}
      <FloatingAnnouncementWidget userRole="alumni-jamaah" />
    </>
  );
};

export default AlumniDashboardContainer;