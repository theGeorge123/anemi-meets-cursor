import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import CreateMeetup from './pages/CreateMeetup';
import Invite from './pages/Invite';
import Respond from './pages/Respond';
import Login from './pages/Login';

function App() {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState('nl');

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
              <button
                onClick={toggleLanguage}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                {language === 'en' ? 'NL' : 'EN'}
              </button>
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 