import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import Login from './features/account/pages/Login';
import Signup from './features/account/pages/Signup';
import Account from './features/account/pages/Account';
import Dashboard from './features/meetups/pages/Dashboard';
import CreateMeetup from './features/meetups/pages/CreateMeetup';
import Invite from './features/meetups/pages/Invite';
import Respond from './features/meetups/pages/Respond';
import Confirmed from './features/meetups/pages/Confirmed';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import { Suspense } from 'react';
import InviteFriend from './features/meetups/pages/InviteFriend';

const AppRoutes = () => {
  const { t } = useTranslation();
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="text-center py-12 text-lg text-primary-700">{t('loading')}</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/account" element={<Account />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-meetup" element={<CreateMeetup />} />
          <Route path="/invite/:token" element={<Invite />} />
          <Route path="/respond/:token" element={<Respond />} />
          <Route path="/confirmed" element={<Confirmed />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/invite-friend/:token" element={<InviteFriend />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
