import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import Home from './pages/Home';
import CreateMeetup from './pages/CreateMeetup';
import Invite from './pages/Invite';
import Respond from './pages/Respond';
import Login from './pages/Login';

function App() {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'nl' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  return (
    <Router>
      <div className="min-h-screen bg-secondary-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-primary-600">anemi meets</h1>
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