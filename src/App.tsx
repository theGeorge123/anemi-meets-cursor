import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import CreateMeetup from './pages/CreateMeetup';
import Invite from './pages/Invite';
import Respond from './pages/Respond';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Footer from './components/Footer';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Terms from './pages/Terms';
import Confirmed from './pages/Confirmed';
import Account from './pages/Account';

function App() {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState('nl');
  const navigate = useNavigate ? useNavigate() : null;

  useEffect(() => {
    i18n.changeLanguage('nl');
  }, [i18n]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'nl' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <Router>
      <div className="min-h-screen bg-secondary-50 relative">
        {/* Abstract SVG Background */}
        <div className="abstract-bg">
          <svg width="100%" height="100%" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="220" cy="180" rx="320" ry="120" fill="#b2dfdb" fillOpacity="0.22" className="animate-float-slow"/>
            <ellipse cx="1200" cy="700" rx="260" ry="100" fill="#e0e0e0" fillOpacity="0.18" className="animate-float-slower"/>
            <ellipse cx="900" cy="220" rx="180" ry="80" fill="#c5cae9" fillOpacity="0.16" className="animate-float-slow"/>
            <ellipse cx="400" cy="800" rx="200" ry="60" fill="#ffe0b2" fillOpacity="0.13" className="animate-float-slower"/>
            <ellipse cx="1100" cy="200" rx="120" ry="60" fill="#f5f7fa" fillOpacity="0.18" className="animate-float-slow"/>
            <ellipse cx="200" cy="700" rx="140" ry="60" fill="#ff914d" fillOpacity="0.10" className="animate-float-slower"/>
            <ellipse cx="1300" cy="150" rx="90" ry="40" fill="#b2dfdb" fillOpacity="0.13" className="animate-float-slow"/>
            <ellipse cx="700" cy="100" rx="110" ry="50" fill="#c5cae9" fillOpacity="0.10" className="animate-float-slower"/>
            <ellipse cx="800" cy="850" rx="160" ry="60" fill="#ff914d" fillOpacity="0.08" className="animate-float-slow"/>
            <g opacity="0.13">
              <path d="M80 120c0-12 10-22 22-22s22 10 22 22c0 12-22 28-22 28s-22-16-22-28z" fill="#ff914d"/>
              <path d="M1360 820c0-8 7-15 15-15s15 7 15 15c0 8-15 18-15 18s-15-10-15-18z" fill="#b2dfdb"/>
              <path d="M700 400c0-7 6-13 13-13s13 6 13 13c0 7-13 15-13 15s-13-8-13-15z" fill="#c5cae9"/>
            </g>
            <g opacity="0.10">
              <rect x="1200" y="100" width="32" height="18" rx="7" fill="#ff914d"/>
              <ellipse cx="1216" cy="100" rx="16" ry="6" fill="#fff" fillOpacity="0.7"/>
              <rect x="1230" y="110" width="8" height="8" rx="4" fill="#b2dfdb"/>
            </g>
          </svg>
        </div>
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <Link to="/">
                  <h1 className="text-2xl font-bold text-primary-600 cursor-pointer">anemi meets</h1>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLanguage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
                >
                  {language === 'en' ? 'NL' : 'EN'}
                </button>
                <Link to="/account" className="ml-2 text-2xl hover:text-primary-600 transition-colors" title="Account">
                  <span role="img" aria-label="account">👤</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-meetup" element={<CreateMeetup />} />
            <Route path="/invite" element={<Invite />} />
            <Route path="/respond" element={<Respond />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/confirmed" element={<Confirmed />} />
            <Route path="/account" element={<Account />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 