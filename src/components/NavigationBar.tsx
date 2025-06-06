import { useState, useContext, useEffect, Fragment, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavigationContext } from '../context/NavigationContext';
import ErrorBoundary from './ErrorBoundary';
import { Transition } from '@headlessui/react';

const NavigationBar = ({ profileEmoji }: { profileEmoji?: string }) => {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { activePath, isAuthenticated } = useContext(NavigationContext);
  const LANGUAGES = [
    { code: 'en', label: 'EN' },
    { code: 'nl', label: 'NL' },
  ];
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langBtnRef = useRef<HTMLButtonElement>(null);

  // Save language preference in localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const handleLanguageChange = (lang: string) => {
    if (lang !== i18n.language) {
      i18n.changeLanguage(lang);
      localStorage.setItem('i18nextLng', lang);
      // Kleine animatie triggeren (optioneel: fade/scale)
      setLangMenuOpen(false);
    }
  };

  // Menu links met vertaalde labels
  const NAV_LINKS = [
    { to: '/dashboard', label: t('navigation.dashboard'), auth: true },
    { to: '/create-meetup', label: t('navigation.plan'), auth: true },
    { to: '/login', label: t('login.title'), auth: false },
  ];

  // Filter links op authenticatie
  const filteredLinks = NAV_LINKS.filter(link => !link.auth || isAuthenticated);

  return (
    <nav className="w-full bg-white/90 border-b border-primary-100 shadow-sm fixed top-0 left-0 z-40" role="navigation">
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
              className={`px-3 py-2 rounded-xl font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-center ${activePath === link.to ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-primary-50'} active:scale-95 active:bg-primary-100`}
              aria-current={activePath === link.to ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          {/* Language Switcher Dropdown */}
          <div className="ml-4 relative">
            <button
              ref={langBtnRef}
              className={`px-3 py-1 rounded-xl border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 font-medium transition flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary-400 ${langMenuOpen ? 'ring-2 ring-primary-400' : ''}`}
              aria-haspopup="listbox"
              aria-expanded={langMenuOpen}
              aria-label={t('selectLanguage', 'Select language')}
              onClick={() => setLangMenuOpen((v) => !v)}
              onBlur={e => {
                if (!e.currentTarget.contains(e.relatedTarget)) setLangMenuOpen(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Escape') setLangMenuOpen(false);
                // Optionally: handle arrow keys for language selection
              }}
            >
              <span className="uppercase font-bold tracking-wider">{i18n.language}</span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <Transition
              as={Fragment}
              show={langMenuOpen}
              enter="transition ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="absolute right-0 mt-2 w-28 bg-white border border-primary-100 rounded-xl shadow-lg z-50 py-1 animate-fade-in">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`flex items-center w-full text-left px-4 py-2 rounded-xl transition-colors duration-100 gap-2 ${i18n.language === lang.code ? 'bg-primary-100 text-primary-700 font-bold' : 'hover:bg-primary-50 text-gray-700'}`}
                    aria-checked={i18n.language === lang.code}
                    role="option"
                  >
                    <span>{lang.label}</span>
                    {i18n.language === lang.code && (
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                ))}
              </div>
            </Transition>
          </div>
          {profileEmoji && (
            <span className="ml-3 text-2xl" title={t('nav.profile')}>
              {profileEmoji}
            </span>
          )}
        </div>
        {/* Mobile hamburger menu */}
        <div className="md:hidden flex items-center gap-2">
          <button
            className="flex items-center justify-center w-11 h-11 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 hover:bg-primary-50 transition-colors active:scale-95 active:bg-primary-100 min-h-[44px] min-w-[44px]"
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
          {/* Language Switcher Dropdown for mobile */}
          <div className="relative">
            <button
              className={`px-3 py-2 rounded-xl border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 font-medium transition flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary-400 min-h-[44px] min-w-[44px]`}
              aria-haspopup="listbox"
              aria-expanded={langMenuOpen}
              aria-label={t('selectLanguage', 'Select language')}
              onClick={() => setLangMenuOpen((v) => !v)}
              onBlur={e => {
                if (!e.currentTarget.contains(e.relatedTarget)) setLangMenuOpen(false);
              }}
            >
              <span className="uppercase font-bold tracking-wider">{i18n.language}</span>
              <svg className={`w-4 h-4 transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {/* Dropdown menu (optioneel) */}
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg py-2 z-50 flex flex-col gap-y-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium text-primary-700 hover:bg-primary-50 transition-colors min-h-[44px] min-w-[44px] ${i18n.language === lang.code ? 'bg-primary-100' : ''}`}
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
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
                className={`w-full text-center px-6 py-4 rounded-xl text-lg font-medium transition-colors min-h-[48px] flex items-center justify-center ${activePath === link.to ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-primary-50'} active:scale-95 active:bg-primary-100`}
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
          {/* Language Switcher Dropdown at the bottom */}
          <div className="w-full px-6 pb-8 flex flex-col items-center">
            <div className="relative">
              <button
                className={`w-full px-3 py-3 rounded-xl border border-primary-200 text-primary-700 bg-white hover:bg-primary-50 font-medium transition flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary-400 ${langMenuOpen ? 'ring-2 ring-primary-400' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={langMenuOpen}
                aria-label={t('selectLanguage', 'Select language')}
                onClick={() => setLangMenuOpen((v) => !v)}
                onBlur={e => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setLangMenuOpen(false);
                }}
              >
                <span className="uppercase font-bold tracking-wider">{i18n.language}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${langMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <Transition
                as={Fragment}
                show={langMenuOpen}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="absolute right-0 mt-2 w-28 bg-white border border-primary-100 rounded-xl shadow-lg z-50 py-1 animate-fade-in">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex items-center w-full text-left px-4 py-2 rounded-xl transition-colors duration-100 gap-2 ${i18n.language === lang.code ? 'bg-primary-100 text-primary-700 font-bold' : 'hover:bg-primary-50 text-gray-700'}`}
                      aria-checked={i18n.language === lang.code}
                      role="option"
                    >
                      <span>{lang.label}</span>
                      {i18n.language === lang.code && (
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </button>
                  ))}
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavigationBarWithBoundary = (props: any) => (
  <ErrorBoundary>
    <NavigationBar {...props} />
  </ErrorBoundary>
);

export default NavigationBarWithBoundary;
