import { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import logo from '../../assets/logo.svg';
import { NavigationContext } from '../context/NavigationContext';

const NAV_LINKS = [
  { to: '/', key: 'nav.home', auth: false },
  { to: '/create-meetup', key: 'nav.newMeetup', auth: true },
  { to: '/account', key: 'nav.account', auth: true },
];

const NavigationBar = ({ profileEmoji }: { profileEmoji?: string }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { activePath, isAuthenticated } = useContext(NavigationContext);

  // Taalwissel
  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'nl' ? 'en' : 'nl');
  };

  // Sluit menu bij navigatie
  const handleNav = (to: string) => {
    setMenuOpen(false);
    navigate(to);
  };

  // Filter links op authenticatie
  const filteredLinks = NAV_LINKS.filter(link => !link.auth || isAuthenticated);

  return (
    <nav className="w-full bg-white/90 border-b border-[#b2dfdb]/40 shadow-sm fixed top-0 left-0 z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-2">
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
              className={`px-3 py-1 rounded-xl font-medium transition-colors ${activePath === link.to ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-primary-50'}`}
            >
              {t(link.key)}
            </Link>
          ))}
          <button
            onClick={toggleLang}
            className="ml-2 px-3 py-1 rounded-xl border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 font-medium transition"
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
          className="md:hidden flex items-center px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          <svg className="w-7 h-7 text-primary-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Mobiel menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 border-t border-[#b2dfdb]/40 shadow-lg">
          <div className="flex flex-col gap-2 px-4 py-3">
            {filteredLinks.map(link => (
              <button
                key={link.to}
                onClick={() => handleNav(link.to)}
                className={`text-left px-3 py-2 rounded-xl font-medium transition-colors ${activePath === link.to ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-primary-50'}`}
              >
                {t(link.key)}
              </button>
            ))}
            <button
              onClick={toggleLang}
              className="px-3 py-2 rounded-xl border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 font-medium transition"
              aria-label="Taal wisselen"
            >
              {i18n.language === 'nl' ? 'EN' : 'NL'}
            </button>
            {profileEmoji && (
              <span className="text-2xl mt-2" title={t('nav.profile')}>
                {profileEmoji}
              </span>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavigationBar; 