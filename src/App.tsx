import { useEffect, useState } from 'react';
import AppRoutes from './AppRoutes';
import NavigationBar from './components/NavigationBar';
import Footer from './components/Footer';
import { OnboardingProvider } from './context/OnboardingContext';
import { NavigationProvider } from './context/NavigationContext';
import { Toaster } from './components/toaster';
import { supabase } from './supabaseClient';

function App() {
  const [profileEmoji, setProfileEmoji] = useState<string>('☕️');

  useEffect(() => {
    const getProfileEmoji = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('emoji')
          .eq('id', user.id)
          .single();
        if (profile?.emoji) {
          setProfileEmoji(profile.emoji);
        }
      }
    };

    getProfileEmoji();

    const handleEmojiUpdate = () => {
      getProfileEmoji();
    };

    window.addEventListener('profile-emoji-updated', handleEmojiUpdate);

    return () => {
      window.removeEventListener('profile-emoji-updated', handleEmojiUpdate);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <NavigationProvider>
        <OnboardingProvider>
          <NavigationBar profileEmoji={profileEmoji} />
          <main className="flex-grow pt-16">
            <AppRoutes />
          </main>
          <Footer />
          <Toaster />
        </OnboardingProvider>
      </NavigationProvider>
    </div>
  );
}

export default App;
