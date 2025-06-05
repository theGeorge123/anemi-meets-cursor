import { Route, Routes } from 'react-router-dom';
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
import Privacy from './pages/Privacy';
import Cookies from './pages/Cookies';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

const AppRoutes = () => {
  const { t } = useTranslation();
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/account" element={<Account />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create-meetup" element={<CreateMeetup />} />
      <Route path="/invite/:id" element={<Invite />} />
      <Route path="/respond/:token" element={<Respond />} />
      <Route path="/confirmed" element={<Confirmed />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
