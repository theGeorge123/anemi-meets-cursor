import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo.svg';
import { NavigationContext } from '../context/NavigationContext';

const NAV_LINKS = [
  { to: '/', key: 'nav.home', auth: false },
  { to: '/create-meetup', key: 'nav.newMeetup', auth: true },
  { to: '/account', key: 'nav.account', auth: true },
];

const NavigationBar = ({ profileEmoji }: { profileEmoji?: string }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { activePath, isAuthenticated } = useContext(NavigationContext);

  // Taalwissel
  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'nl' ? 'en' : 'nl');
  };

  // Filter links op authenticatie
  const filteredLinks = NAV_LINKS.filter(link => !link.auth || isAuthenticated);

  return (
    <nav className="w-full bg-white/90 border-b border-[#b2dfdb]/40 shadow-sm fixed top-0 left-0 z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo + naam */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-700 hover:opacity-80">
          <img src={logo} alt="Anemi Meets logo" className="h-8 w-8" />
          <span className="hidden sm:inline">Anemi Meets</span>
        </Link>
        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-4">
          {filteredLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1 rounded-xl font-medium transition-colors ${activePath === link.to ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-primary-50'} active:scale-95 active:bg-[#b2dfdb]`}
            >
              {t(link.key)}
            </Link>
          ))}
          <button
            onClick={toggleLang}
            className="ml-2 px-3 py-1 rounded-xl border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 font-medium transition active:scale-95 active:bg-[#b2dfdb]"
            aria-label="Taal wisselen"
          >
            {i18n.language === 'nl' ? 'EN' : 'NL'}
          </button>
          {profileEmoji && (
            <span className="ml-3 text-2xl" title={t('nav.profile')}>
              {profileEmoji}
            </span>
          )}
        </div>
        {/* Hamburger menu */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 hover:bg-primary-50 transition-colors active:scale-95 active:bg-[#b2dfdb]"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <svg className="w-6 h-6 text-primary-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {/* Mobile menu */}
      <div 
        className={`md:hidden fixed inset-0 bg-white/95 z-30 transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
          {filteredLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`w-full text-center px-6 py-3 rounded-xl text-lg font-medium transition-colors ${
                activePath === link.to ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-primary-50'
              } active:scale-95 active:bg-[#b2dfdb]`}
              onClick={() => setMenuOpen(false)}
            >
              {t(link.key)}
            </Link>
          ))}
          <button
            onClick={() => {
              toggleLang();
              setMenuOpen(false);
            }}
            className="w-full px-6 py-3 rounded-xl border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 font-medium transition text-lg active:scale-95 active:bg-[#b2dfdb]"
          >
            {i18n.language === 'nl' ? 'EN' : 'NL'}
          </button>
          {profileEmoji && (
            <span className="text-3xl mt-2" title={t('nav.profile')}>
              {profileEmoji}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar; 