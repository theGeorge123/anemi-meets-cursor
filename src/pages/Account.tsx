import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

const Account = () => {
  const [user, setUser] = useState<any>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [emojiSaving, setEmojiSaving] = useState(false);
  const [gender, setGender] = useState<string>('');
  const [genderSaving, setGenderSaving] = useState(false);
  const [genderMsg, setGenderMsg] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [age, setAge] = useState<number | ''>('');
  const [ageSaving, setAgeSaving] = useState(false);
  const [ageMsg, setAgeMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const EMOJI_OPTIONS = ['😃','😎','🧑‍🎤','🦄','🐱','🐶','☕️','🌈','💡','❤️'];
  const GENDER_OPTIONS = [
    { value: 'man', label: 'Man' },
    { value: 'vrouw', label: 'Vrouw' },
    { value: 'anders', label: 'Anders' },
    { value: 'wil_niet_zeggen', label: 'Wil ik niet zeggen' },
  ];

  function generateRandomName() {
    const adjectives = ['Blije', 'Snelle', 'Slimme', 'Vrolijke', 'Stoere', 'Lieve', 'Dappere', 'Grappige', 'Knappe', 'Zonnige'];
    const animals = ['Panda', 'Leeuw', 'Uil', 'Vos', 'Olifant', 'Aap', 'Egel', 'Hond', 'Kat', 'Vogel'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${adj} ${animal}`;
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      // Haal naam op uit user_metadata of profiel
      let name = session.user.user_metadata?.full_name;
      if (!name) {
        const { data: profile } = await supabase.from('profiles').select('full_name, emoji, gender, age').eq('id', session.user.id).single();
        name = profile?.full_name;
        if (profile?.emoji) setSelectedEmoji(profile.emoji);
        if (profile?.gender) setGender(profile.gender);
        if (profile?.age !== undefined && profile?.age !== null) setAge(profile.age);
      } else {
        // Haal leeftijd op als user bekend is
        const { data: profile } = await supabase.from('profiles').select('age').eq('id', session.user.id).single();
        if (profile?.age !== undefined && profile?.age !== null) setAge(profile.age);
      }
      if (!name) {
        name = generateRandomName();
      }
      setDisplayName(name);
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

  const handleGenderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGender = e.target.value;
    setGender(newGender);
    setGenderSaving(true);
    setGenderMsg(null);
    if (!user || !user.id) {
      setGenderMsg('Je bent niet ingelogd.');
      setGenderSaving(false);
      return;
    }
    const { error } = await supabase.from('profiles').update({ gender: newGender }).eq('id', user.id);
    if (error) {
      setGenderMsg('Opslaan mislukt: ' + error.message);
    } else {
      setGenderMsg('Top! Je geslacht is opgeslagen.');
      setShowGenderDropdown(false);
    }
    setGenderSaving(false);
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') setAge('');
    else if (/^\d{0,3}$/.test(val)) setAge(Number(val));
  };

  const handleAgeBlur = async () => {
    if (!user || !user.id) return;
    setAgeSaving(true);
    setAgeMsg(null);
    const value = age === '' ? null : age;
    const { error } = await supabase.from('profiles').update({ age: value }).eq('id', user.id);
    if (error) {
      setAgeMsg('Opslaan mislukt: ' + error.message);
    } else {
      setAgeMsg('Top! Je leeftijd is opgeslagen.');
    }
    setAgeSaving(false);
  };

  // Shuffle emoji
  const handleShuffleEmoji = async () => {
    if (!user || !user.id) return;
    let newEmoji = selectedEmoji;
    while (newEmoji === selectedEmoji) {
      newEmoji = EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)];
    }
    await handleEmojiSelect(newEmoji);
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
        <h1 className="text-2xl font-bold text-primary-600 mb-2 flex items-center justify-center gap-2">
          Hallo, {displayName}!
        </h1>
        {user ? (
          <>
            <div className="text-lg text-gray-700 mb-2">{t('account.loggedInAs')}</div>
            <div className="text-xl font-semibold text-primary-700 mb-4 flex items-center justify-center gap-2">
              {displayName} {selectedEmoji}
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
            {selectedEmoji}
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
            <button
              type="button"
              className="ml-2 px-4 py-3 rounded-full border-4 border-[#b2dfdb] bg-[#e0f7fa] text-2xl font-bold shadow-sm hover:bg-[#b2dfdb]/60 transition-all duration-150"
              onClick={handleShuffleEmoji}
              disabled={emojiSaving}
              aria-label="Shuffle emoji"
              title="Shuffle emoji"
            >
              🔀
            </button>
          </div>
          {emojiSaving && <div className="text-xs text-gray-500 mt-2">{t('account.saving')}</div>}
          {/* Gender: informeel tonen of dropdown */}
          <div className="mt-8 mb-2 text-left">
            {gender && !showGenderDropdown ? (
              <div className="flex flex-col gap-2">
                <div className="text-lg font-medium text-gray-700">
                  Jouw gekozen geslacht: <span className="font-bold text-primary-700">{GENDER_OPTIONS.find(opt => opt.value === gender)?.label || gender}</span> 🎉
                </div>
                <button
                  type="button"
                  className="btn-secondary w-fit px-4 py-1 text-sm"
                  onClick={() => setShowGenderDropdown(true)}
                >
                  Toch wijzigen?
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="gender-select" className="block text-lg font-medium text-gray-700 mb-2">
                  Wat is je geslacht?
                </label>
                <select
                  id="gender-select"
                  value={gender}
                  onChange={handleGenderChange}
                  className="input-field mt-1 w-full max-w-xs"
                  disabled={genderSaving}
                >
                  <option value="">Selecteer...</option>
                  {GENDER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {genderMsg && <div className="text-sm mt-2 text-green-700">{genderMsg}</div>}
              </div>
            )}
          </div>
          {/* Leeftijd veld */}
          <div className="mt-8 mb-2 text-left">
            <label htmlFor="age-input" className="block text-lg font-medium text-gray-700 mb-2">
              {t('common.age')}
            </label>
            <input
              id="age-input"
              type="number"
              min="0"
              max="120"
              className="input-field mt-1 w-full max-w-xs"
              value={age}
              onChange={handleAgeChange}
              onBlur={handleAgeBlur}
              disabled={ageSaving}
              placeholder={t('common.age')}
            />
            {ageMsg && <div className="text-sm mt-2 text-green-700">{ageMsg}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Account; 