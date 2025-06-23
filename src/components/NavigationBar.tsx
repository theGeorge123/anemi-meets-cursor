import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavigationContext } from '../context/navigation';
import ErrorBoundary from './ErrorBoundary';

export interface NavigationBarProps {
  profileEmoji?: string;
}
const NavigationBar: React.FC<NavigationBarProps> = ({ profileEmoji }) => {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { activePath, isAuthenticated } = useContext(NavigationContext);

  // Menu links met vertaalde labels
  const NAV_LINKS = [
    { to: '/dashboard', label: t('navigation.dashboard'), auth: true },
    { to: '/friends', label: t('navigation.friends', 'Friends'), auth: true },
    { to: '/login', label: t('login.title'), auth: false },
  ];

  // Filter links op authenticatie
  const filteredLinks = NAV_LINKS.filter((link) => !link.auth || isAuthenticated);

  // Language selector handler
  const LANGUAGES = [
    { code: 'en', label: 'EN' },
    { code: 'nl', label: 'NL' },
  ];

  return (
    <nav
      className="w-full bg-white/90 border-b border-primary-100 shadow-sm fixed top-0 left-0 z-40"
      role="navigation"
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo + naam replaced with styled span */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-semibold text-primary-700">Anemi Meets</span>
        </Link>
        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
          {filteredLinks.map((link) =>
            link.to === '/login' && isAuthenticated ? (
              <span
                key="logged-in"
                className="px-3 py-2 rounded-xl font-medium text-green-700 bg-green-100"
              >
                Yes, you're logged in!
              </span>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-xl font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-center ${activePath === link.to ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-primary-50'} active:scale-95 active:bg-primary-100`}
                aria-current={activePath === link.to ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ),
          )}
          {/* Settings/Profile button */}
          <Link
            to="/account"
            className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-colors min-h-[44px] min-w-[44px] text-primary-700 hover:bg-primary-50 active:scale-95 active:bg-primary-100"
            aria-label={t('navigation.settings', 'Instellingen')}
          >
            <span className="text-xl">⚙️</span>
            <span className="hidden sm:inline">{t('navigation.settings', 'Instellingen')}</span>
          </Link>
          {profileEmoji && (
            <span className="ml-3 text-2xl" title={t('nav.profile')}>
              {profileEmoji}
            </span>
          )}
        </div>
        {/* Language selector and burger menu always together on the right */}
        <div className="flex items-center gap-2 md:gap-1">
          {/* Language selector: always visible */}
          <div className="flex gap-1 items-center" aria-label="Language selector">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`px-2 py-1 rounded text-sm font-semibold border transition-colors ${i18n.language === lang.code ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50'}`}
                aria-pressed={i18n.language === lang.code}
                aria-label={lang.label}
              >
                {lang.label}
              </button>
            ))}
          </div>
          {/* Mobile hamburger menu */}
          <div className="md:hidden flex items-center gap-2">
            <button
              className="flex items-center justify-center w-11 h-11 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 hover:bg-primary-50 transition-colors active:scale-95 active:bg-primary-100 min-h-[44px] min-w-[44px]"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <svg
                className="w-6 h-6 text-primary-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
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
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-4 pt-8">
            {filteredLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`w-full text-center px-6 py-4 rounded-xl text-lg font-medium transition-colors min-h-[48px] flex items-center justify-center ${activePath === link.to ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-primary-50'} active:scale-95 active:bg-primary-100`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {/* Settings/Profile button in mobile menu */}
            <Link
              to="/account"
              className="w-full text-center px-6 py-4 rounded-xl text-lg font-medium flex items-center justify-center gap-2 text-primary-700 hover:bg-primary-50 active:scale-95 active:bg-primary-100"
              onClick={() => setMenuOpen(false)}
              aria-label={t('navigation.settings', 'Instellingen')}
            >
              <span className="text-2xl">⚙️</span>
              <span>{t('navigation.settings', 'Instellingen')}</span>
            </Link>
            {profileEmoji && (
              <span className="text-3xl mt-2" title={t('nav.profile')}>
                {profileEmoji}
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavigationBarWithBoundary: React.FC<NavigationBarProps> = (props) => (
  <ErrorBoundary>
    <NavigationBar {...props} />
  </ErrorBoundary>
);

export default NavigationBarWithBoundary;
