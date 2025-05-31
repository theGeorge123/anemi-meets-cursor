import { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../assets/logo.svg';
import { NavigationContext } from '../context/NavigationContext';

const NavigationBar = ({ profileEmoji }: { profileEmoji?: string }) => {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { activePath, isAuthenticated } = useContext(NavigationContext);

  // Save language preference in localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Menu links met vertaalde labels
  const NAV_LINKS = [
    { to: '/dashboard', label: t('dashboard.title'), auth: true },
    { to: '/create-meetup', label: t('common.newMeetup'), auth: true },
    { to: '/login', label: t('common.login'), auth: false },
  ];

  // Filter links op authenticatie
  const filteredLinks = NAV_LINKS.filter(link => !link.auth || isAuthenticated);

  return (
    <nav className="w-full bg-white/90 border-b border-[#b2dfdb]/40 shadow-sm fixed top-0 left-0 z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo + naam replaced with styled span */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-semibold text-primary-700">Anemi Meets</span>
        </Link>
        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
          {filteredLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1 rounded-xl font-medium transition-colors ${activePath === link.to ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-primary-50'} active:scale-95 active:bg-[#b2dfdb]`}
            >
              {link.label}
            </Link>
          ))}
          {/* Interactive language switcher on the far right */}
          <div className="ml-4 relative group">
            <button
              className="px-3 py-1 rounded-xl border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 font-medium transition active:scale-95 active:bg-[#b2dfdb] flex items-center gap-1"
              aria-haspopup="listbox"
              aria-expanded="false"
            >
              <span className="uppercase">{i18n.language}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute right-0 mt-2 w-24 bg-white border border-primary-100 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`block w-full text-left px-4 py-2 rounded-t-xl ${i18n.language === 'en' ? 'bg-primary-100 text-primary-700 font-bold' : 'hover:bg-primary-50 text-gray-700'}`}
              >EN</button>
              <button
                onClick={() => handleLanguageChange('nl')}
                className={`block w-full text-left px-4 py-2 rounded-b-xl ${i18n.language === 'nl' ? 'bg-primary-100 text-primary-700 font-bold' : 'hover:bg-primary-50 text-gray-700'}`}
              >NL</button>
            </div>
          </div>
          {profileEmoji && (
            <span className="ml-3 text-2xl" title={t('nav.profile')}>
              {profileEmoji}
            </span>
          )}
        </div>
        {/* Hamburger menu for mobile */}
        <div className="md:hidden flex items-center gap-2">
          <button
            className="flex items-center justify-center w-10 h-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 hover:bg-primary-50 transition-colors active:scale-95 active:bg-[#b2dfdb]"
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
          {/* Interactive language switcher for mobile, on the right */}
          <div className="relative group ml-2">
            <button
              className="px-3 py-1 rounded-xl border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 font-medium transition active:scale-95 active:bg-[#b2dfdb] flex items-center gap-1"
              aria-haspopup="listbox"
              aria-expanded="false"
            >
              <span className="uppercase">{i18n.language}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="absolute right-0 mt-2 w-24 bg-white border border-primary-100 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`block w-full text-left px-4 py-2 rounded-t-xl ${i18n.language === 'en' ? 'bg-primary-100 text-primary-700 font-bold' : 'hover:bg-primary-50 text-gray-700'}`}
              >EN</button>
              <button
                onClick={() => handleLanguageChange('nl')}
                className={`block w-full text-left px-4 py-2 rounded-b-xl ${i18n.language === 'nl' ? 'bg-primary-100 text-primary-700 font-bold' : 'hover:bg-primary-50 text-gray-700'}`}
              >NL</button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div
        className={`md:hidden fixed inset-0 z-30 transition-all duration-300 ease-in-out ${
          menuOpen ? 'bg-black/30 opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-modal="true"
        aria-label={t('nav.menu')}
        tabIndex={-1}
        onClick={() => setMenuOpen(false)}
      >
        <div
          className={`fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white/95 shadow-lg transition-transform duration-300 ease-in-out ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          } flex flex-col justify-between`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-4 pt-8">
            {filteredLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`w-full text-center px-6 py-4 rounded-xl text-lg font-medium transition-colors min-h-[48px] flex items-center justify-center ${
                  activePath === link.to ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-primary-50'
                } active:scale-95 active:bg-[#b2dfdb]`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {profileEmoji && (
              <span className="text-3xl mt-2" title={t('nav.profile')}>
                {profileEmoji}
              </span>
            )}
          </div>
          {/* Language switcher at the bottom */}
          <div className="w-full px-6 pb-8 flex flex-col items-center">
            <div className="relative group w-full">
              <button
                className="w-full px-3 py-3 rounded-xl border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 font-medium transition active:scale-95 active:bg-[#b2dfdb] flex items-center gap-1 justify-center"
                aria-haspopup="listbox"
                aria-expanded="false"
              >
                <span className="uppercase">{i18n.language}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute right-0 mt-2 w-24 bg-white border border-primary-100 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`block w-full text-left px-4 py-2 rounded-t-xl ${i18n.language === 'en' ? 'bg-primary-100 text-primary-700 font-bold' : 'hover:bg-primary-50 text-gray-700'}`}
                >EN</button>
                <button
                  onClick={() => handleLanguageChange('nl')}
                  className={`block w-full text-left px-4 py-2 rounded-b-xl ${i18n.language === 'nl' ? 'bg-primary-100 text-primary-700 font-bold' : 'hover:bg-primary-50 text-gray-700'}`}
                >NL</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar; 