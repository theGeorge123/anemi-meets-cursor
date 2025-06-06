import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import Dashboard from './pages/Dashboard';
import CreateMeetup from './pages/CreateMeetup';
import Invite from './pages/Invite';
import Respond from './pages/Respond';
import Confirmed from './pages/Confirmed';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import { Suspense } from 'react';
import InviteFriend from './pages/InviteFriend';

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
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/invite-friend/:token" element={<InviteFriend />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
