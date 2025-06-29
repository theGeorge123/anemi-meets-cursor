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
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import { Suspense } from 'react';
import InviteFriend from './pages/InviteFriend';
import ChangeEmailConfirm from './pages/ChangeEmailConfirm';
import ResetPassword from './pages/ResetPassword';
import CheckEmail from './pages/CheckEmail';
import Friends from './pages/Friends';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Terms from './pages/Terms';
import SoloAdventure from './pages/SoloAdventure';
import Success from './pages/Success';

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
          <Route path="/change-email-confirm" element={<ChangeEmailConfirm />} />
          <Route path="/invite-friend/:token" element={<InviteFriend />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/invite-friend" element={<InviteFriend />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/terms-and-conditions" element={<Terms />} />
          <Route path="/success" element={<Success />} />
          <Route path="/solo-adventure" element={<SoloAdventure />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
