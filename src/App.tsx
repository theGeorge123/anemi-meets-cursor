import { BrowserRouter } from 'react-router-dom';
// import { useTranslation } from 'react-i18next'; // Verwijderd, niet gebruikt
import { useState, useEffect } from 'react';
import Footer from './components/Footer';
import AppRoutes from './AppRoutes';
import NavigationBar from './components/NavigationBar';
import { supabase } from './supabaseClient';
import { NavigationProvider } from './context/NavigationContext';

function App() {
  // const { i18n } = useTranslation(); // Verwijderd, niet gebruikt
  // const [language, setLanguage] = useState('nl'); // Verwijderd, niet gebruikt
  const [profileEmoji, setProfileEmoji] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchEmoji = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('emoji').eq('id', session.user.id).maybeSingle();
        if (profile && profile.emoji) setProfileEmoji(profile.emoji);
        else setProfileEmoji(undefined);
      } else {
        setProfileEmoji(undefined);
      }
    };
    fetchEmoji();
    window.addEventListener('profile-emoji-updated', fetchEmoji);
    return () => window.removeEventListener('profile-emoji-updated', fetchEmoji);
  }, []);

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <NavigationProvider>
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
          <NavigationBar profileEmoji={profileEmoji} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
            <button onClick={() => { throw new Error("This is your first error!"); }} style={{marginBottom: 24, padding: 12, background: '#ff914d', color: 'white', borderRadius: 8, fontWeight: 'bold'}}>Break the world</button>
            <AppRoutes />
          </main>
          <Footer />
        </div>
      </NavigationProvider>
    </BrowserRouter>
  );
}

export default App; 