import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from './supabaseClient';
import Home from './pages/Home';
import CreateMeetup from './pages/CreateMeetup';
import Invite from './pages/Invite';
import Respond from './pages/Respond';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Terms from './pages/Terms';
import Confirmed from './pages/Confirmed';
import Account from './pages/Account';
import Dashboard from './pages/Dashboard';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';

const AppRoutes = () => {
  const { t } = useTranslation();
  const [sessionExpiresSoon, setSessionExpiresSoon] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (session.expires_at) {
          const expiresIn = session.expires_at * 1000 - Date.now();
          setSessionExpiresSoon(expiresIn < 2 * 60 * 1000);
        }
        if (window.location.pathname === '/login') {
          navigate('/account');
        }
      } else {
        setSessionExpiresSoon(false);
      }
    };
    fetchUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    window.addEventListener('profile-emoji-updated', fetchUser);
    const interval = setInterval(fetchUser, 60 * 1000);
    return () => {
      listener?.subscription.unsubscribe();
      window.removeEventListener('profile-emoji-updated', fetchUser);
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <ErrorBoundary>
      {sessionExpiresSoon && (
        <div className="fixed top-0 left-0 w-full bg-yellow-200 text-yellow-900 text-center py-2 z-50 font-semibold shadow-lg">
          {t('common.sessionExpiresSoon')}
          <Link to="/login" className="ml-4 underline text-primary-700">{t('common.login')}</Link>
        </div>
      )}
      <Suspense fallback={<div className="text-center py-12 text-lg text-primary-700">{t('common.loading')}</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-meetup" element={<CreateMeetup />} />
          <Route path="/invite/:token" element={<Invite />} />
          <Route path="/respond" element={<Respond />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/confirmed" element={<Confirmed />} />
          <Route path="/account" element={<Account />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} errorElement={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes; 