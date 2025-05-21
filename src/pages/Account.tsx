import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

const Account = () => {
  const [user, setUser] = useState<any>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [emojiSaving, setEmojiSaving] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const EMOJI_OPTIONS = ['😃','😎','🧑‍🎤','🦄','🐱','🐶','☕️','🌈','💡','❤️'];

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      // Haal emoji op uit profiel
      const { data: profile } = await supabase.from('profiles').select('emoji').eq('id', session.user.id).single();
      if (profile && profile.emoji) setSelectedEmoji(profile.emoji);
    };
    getUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (!user || !user.id) {
      alert('Je bent niet ingelogd. Log opnieuw in om je emoji te wijzigen.');
      return;
    }
    setEmojiSaving(true);
    const { error } = await supabase.from('profiles').update({ emoji }).eq('id', user.id);
    if (error) {
      alert('Emoji opslaan mislukt: ' + error.message);
    } else {
      setSelectedEmoji(emoji);
      window.dispatchEvent(new Event('profile-emoji-updated'));
    }
    setEmojiSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto py-12 flex flex-col items-center">
      {/* Uitleg gratis account */}
      <div className="bg-[#fff7f3] rounded-xl p-4 mb-4 text-center shadow text-primary-700 font-medium text-base w-full">
        {t('common.freeAccountInfo')}
      </div>
      <div className="bg-[#b2dfdb]/80 rounded-full shadow-2xl p-6 mb-6 flex items-center justify-center">
        <span className="text-6xl" role="img" aria-label="avatar">👤</span>
      </div>
      <div className="card bg-white/80 w-full mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary-600 mb-2">{t('common.createAccount')}</h1>
        {user ? (
          <>
            <div className="text-lg text-gray-700 mb-2">Ingelogd als:</div>
            <div className="text-xl font-semibold text-primary-700 mb-4 flex items-center justify-center gap-2">
              {selectedEmoji && <span className="text-2xl">{selectedEmoji}</span>}
              {user.email}
            </div>
            <button onClick={handleLogout} className="btn-secondary w-full">Uitloggen</button>
          </>
        ) : (
          <>
            <div className="text-lg text-gray-700 mb-4">Hé! Als je al een account hebt, log gezellig in, dan regelen we samen connecties.</div>
            <button onClick={() => navigate('/login')} className="btn-primary w-full">Inloggen</button>
          </>
        )}
      </div>
      <div className="bg-[#ff914d]/10 rounded-3xl p-6 shadow text-center mt-4 w-full">
        <p className="text-lg text-primary-700 font-semibold mb-2">Welkom bij Anemi Meets!</p>
        {user ? (
          <p className="text-gray-700">Hier kun je je account beheren, uitloggen of je gegevens bekijken.<br/>We maken het makkelijk om echte connecties te versterken <span role="img" aria-label="connect">🤝</span></p>
        ) : (
          <>
            <p className="text-gray-700 mb-2">
              <span className="text-2xl">✨</span> Echte connecties beginnen bij jou!<br/>
              Zet vandaag de eerste stap en maak een account aan.<br/>
              <span className="text-xl">🌱🤗</span>
            </p>
            <p className="text-gray-700 mb-4">Nog geen account? Geen zorgen, je bent zo aangemeld!</p>
            <button
              onClick={() => navigate('/signup')}
              className="btn-primary px-8 py-3 rounded-2xl font-semibold text-lg mt-2"
            >
              {t('common.createAccount')}
            </button>
          </>
        )}
      </div>
      {/* Emoji-profiel sectie */}
      {user && (
        <div className="bg-white/70 rounded-3xl p-6 shadow text-center mt-4 w-full">
          <p className="text-primary-700 font-semibold mb-2">We willen ook een emoji bij je naam hebben! Kies je favoriet:</p>
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                className={`text-2xl px-3 py-2 rounded-full border-2 transition-all duration-150 ${selectedEmoji === emoji ? 'border-[#ff914d] bg-[#ff914d]/10' : 'border-transparent hover:border-[#b2dfdb]'}`}
                onClick={() => handleEmojiSelect(emoji)}
                disabled={emojiSaving}
                aria-label={`Kies emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {emojiSaving && <div className="text-xs text-gray-500">Opslaan...</div>}
        </div>
      )}
    </div>
  );
};

export default Account; 