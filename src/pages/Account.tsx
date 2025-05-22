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
            <div className="text-lg text-gray-700 mb-2">{t('account.loggedInAs')}</div>
            <div className="text-xl font-semibold text-primary-700 mb-4 flex items-center justify-center gap-2">
              {selectedEmoji && <span className="text-2xl">{selectedEmoji}</span>}
              {user.email}
            </div>
            <button onClick={handleLogout} className="btn-secondary w-full">{t('account.logout')}</button>
          </>
        ) : (
          <>
            <div className="text-lg text-gray-700 mb-4">{t('account.loginPrompt')}</div>
            <button onClick={() => navigate('/login')} className="btn-primary w-full">{t('account.login')}</button>
          </>
        )}
      </div>
      <div className="bg-[#ff914d]/10 rounded-3xl p-6 shadow text-center mt-4 w-full">
        <p className="text-lg text-primary-700 font-semibold mb-2">{t('account.welcomeTitle')}</p>
        {user ? (
          <p className="text-gray-700">{t('account.welcomeDesc')}</p>
        ) : (
          <>
            <p className="text-gray-700 mb-2">
              <span className="text-2xl">✨</span> {t('account.connectStart')}<br/>
              {t('account.connectCta')}<br/>
              <span className="text-xl">🌱🤗</span>
            </p>
            <p className="text-gray-700 mb-4">{t('account.noAccountYet')}</p>
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
        <div className="bg-white/70 rounded-3xl p-6 shadow text-center mt-8 w-full border-2 border-[#ff914d]/40">
          <h2 className="text-2xl font-bold text-primary-700 mb-2 flex items-center justify-center gap-2">
            <span role="img" aria-label="emoji">🎨</span> {t('account.emojiProfileTitle')}
          </h2>
          <p className="text-base text-gray-700 mb-4">{t('account.emojiProfileDesc')}</p>
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                className={`text-3xl px-4 py-3 rounded-full border-4 transition-all duration-150 font-bold shadow-sm ${selectedEmoji === emoji ? 'border-[#ff914d] bg-[#ff914d]/20 scale-110 ring-2 ring-[#ff914d]' : 'border-transparent hover:border-[#b2dfdb]'}`}
                onClick={() => handleEmojiSelect(emoji)}
                disabled={emojiSaving}
                aria-label={`Kies emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {emojiSaving && <div className="text-xs text-gray-500 mt-2">{t('account.saving')}</div>}
        </div>
      )}
    </div>
  );
};

export default Account; 