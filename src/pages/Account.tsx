import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

// TypeScript interfaces voor typeveiligheid
interface Profile {
  id: string;
  full_name: string;
  email: string;
  emoji?: string;
  gender?: string;
  age?: number;
  wants_updates: boolean;
  is_private: boolean;
}

interface Invitation {
  id: string;
  selected_date: string;
  selected_time: string;
  cafe_id?: string;
  cafe_name?: string;
  status: string;
  email_b?: string;
}

const Account = () => {
  const [user, setUser] = useState<Profile | null>(null);
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
  const [myMeetups, setMyMeetups] = useState<Invitation[]>([]);
  const [meetupsLoading, setMeetupsLoading] = useState(false);
  const [meetupsError, setMeetupsError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pendingGender, setPendingGender] = useState<string>('');
  const [pendingAge, setPendingAge] = useState<number | ''>('');
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState<string | null>(null);

  const EMOJI_OPTIONS = ['😃','😎','🧑‍🎤','🦄','🐱','🐶','☕️','🌈','💡','❤️'];
  const genderOptions = t('common.genderOptions', { returnObjects: true }) as { value: string, label: string }[];

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
      // Haal profiel op
      const { data: testProfiles, error: testProfilesError } = await supabase.from('profiles').select('*').limit(1);
      console.log('TEST PROFILES:', testProfiles, testProfilesError);
      if (testProfiles) {
        setUser(testProfiles[0] as Profile);
        setDisplayName(testProfiles[0].full_name || generateRandomName());
        if (testProfiles[0].emoji) setSelectedEmoji(testProfiles[0].emoji);
        if (testProfiles[0].gender) setGender(testProfiles[0].gender);
        if (testProfiles[0].age !== undefined && testProfiles[0].age !== null) setAge(testProfiles[0].age);
        setWantsUpdates(!!testProfiles[0].wants_updates);
        setIsPrivate(!!testProfiles[0].is_private);
      } else {
        setUser(null);
        setDisplayName(generateRandomName());
      }
      setEmail(session.user.email || '');
      setName(session.user.user_metadata?.full_name || '');
      // Haal meetups op
      setMeetupsLoading(true);
      setMeetupsError(null);
      const { data: meetups, error: meetupsError } = await supabase
        .from('invitations')
        .select('id, selected_date, selected_time, cafe_id, cafe_name, status, email_b')
        .or(`invitee_id.eq.${session.user.id},email_b.eq."${session.user.email}"`);
      if (meetupsError) {
        setMeetupsError(t('account.errorLoadingMeetups'));
      } else {
        setMyMeetups((meetups || []) as Invitation[]);
      }
      setMeetupsLoading(false);
    };
    getUser();
    setPendingGender(gender);
    setPendingAge(age);
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (!user || !user.id) {
      setGenderMsg(t('account.errorNotLoggedIn'));
      return;
    }
    setEmojiSaving(true);
    const { error } = await supabase.from('profiles').update({ emoji }).eq('id', user.id);
    if (error) {
      let msg = t('account.errorSaveFailed');
      const code = error.code || '';
      switch (code) {
        case 'error_network':
          msg = t('account.errorNetwork');
          break;
        case 'validation_failed':
          msg = t('account.errorValidationFailed');
          break;
        default:
          const errMsg = error.message?.toLowerCase() || '';
          if (errMsg.includes('network')) {
            msg = t('account.errorNetwork');
          } else if (errMsg.includes('valid')) {
            msg = t('account.errorValidationFailed');
          }
      }
      setGenderMsg(msg);
    } else {
      setSelectedEmoji(emoji);
      setGenderMsg(t('account.saveSuccess'));
      window.dispatchEvent(new Event('profile-emoji-updated'));
    }
    setEmojiSaving(false);
  };

  const handleGenderSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPendingGender(e.target.value);
    setGenderMsg(null);
  };

  const handleGenderSave = async () => {
    if (!user || !user.id) {
      setGenderMsg(t('account.errorNotLoggedIn'));
      return;
    }
    setGenderSaving(true);
    const { error } = await supabase.from('profiles').update({ gender: pendingGender }).eq('id', user.id);
    if (error) {
      let msg = t('account.errorSaveFailed');
      const code = error.code || '';
      switch (code) {
        case 'error_network':
          msg = t('account.errorNetwork');
          break;
        case 'validation_failed':
          msg = t('account.errorValidationFailed');
          break;
        default:
          const errMsg = error.message?.toLowerCase() || '';
          if (errMsg.includes('network')) {
            msg = t('account.errorNetwork');
          } else if (errMsg.includes('valid')) {
            msg = t('account.errorValidationFailed');
          }
      }
      setGenderMsg(msg);
    } else {
      setGender(pendingGender);
      setGenderMsg(t('account.saveSuccess'));
      setShowGenderDropdown(false);
    }
    setGenderSaving(false);
  };

  const handleAgeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') setPendingAge('');
    else if (/^\d{0,3}$/.test(val)) setPendingAge(Number(val));
    setAgeMsg(null);
  };

  const handleAgeSave = async () => {
    if (!user || !user.id) return;
    setAgeSaving(true);
    setAgeMsg(null);
    const value = pendingAge === '' ? null : pendingAge;
    const { error } = await supabase.from('profiles').update({ age: value }).eq('id', user.id);
    if (error) {
      let msg = t('account.errorSaveFailed');
      const code = error.code || '';
      switch (code) {
        case 'error_network':
          msg = t('account.errorNetwork');
          break;
        case 'validation_failed':
          msg = t('account.errorValidationFailed');
          break;
        default:
          const errMsg = error.message?.toLowerCase() || '';
          if (errMsg.includes('network')) {
            msg = t('account.errorNetwork');
          } else if (errMsg.includes('valid')) {
            msg = t('account.errorValidationFailed');
          }
      }
      setAgeMsg(msg);
    } else {
      setAge(pendingAge);
      setAgeMsg(t('account.saveSuccess'));
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

  // Profielnaam wijzigen
  const handleNameSave = async () => {
    if (!user || !user.id) return;
    if (!name.trim()) {
      setNameMsg(t('account.errorNameRequired'));
      return;
    }
    setNameSaving(true);
    setNameMsg(null);
    // Update in profiles
    const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user.id);
    // Update in user_metadata
    const { error: metaError } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    if (error || metaError) {
      setNameMsg(t('account.errorSaveFailed'));
    } else {
      setNameMsg(t('account.nameChanged'));
      setDisplayName(name.trim());
    }
    setNameSaving(false);
  };

  // E-mail wijzigen
  const handleEmailSave = async () => {
    if (!user) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailMsg(t('account.errorEmailInvalid'));
      return;
    }
    setEmailSaving(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      let msg = t('account.errorSaveFailed');
      const code = error.code || '';
      if (code === 'email_exists') msg = t('account.errorEmailInUse');
      else if (code === 'invalid_email') msg = t('account.errorEmailInvalid');
      setEmailMsg(msg);
    } else {
      setEmailMsg(t('account.emailChanged'));
    }
    setEmailSaving(false);
  };

  // Wachtwoord wijzigen
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.new.length < 8) {
      setPwMsg(t('common.passwordTooShort'));
      return;
    }
    if (pwForm.new !== pwForm.confirm) {
      setPwMsg(t('account.errorPasswordMismatch'));
      return;
    }
    setPwSaving(true);
    // Supabase vereist alleen het nieuwe wachtwoord, maar voor extra veiligheid kun je evt. eerst re-authenticeren
    const { error } = await supabase.auth.updateUser({ password: pwForm.new });
    if (error) {
      let msg = t('account.errorSaveFailed');
      const code = error.code || '';
      if (code === 'password_weak') msg = t('account.errorPasswordWeak');
      setPwMsg(msg);
    } else {
      setPwMsg(t('account.passwordChanged'));
      setPwForm({ current: '', new: '', confirm: '' });
    }
    setPwSaving(false);
  };

  // Account verwijderen
  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) {
        setDeleteMsg(t('account.errorNotLoggedIn'));
        setDeleting(false);
        return;
      }
      const res = await fetch('/functions/v1/delete-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeleteMsg(t('account.deleteAccountError'));
        setDeleting(false);
        return;
      }
      setDeleteMsg(t('account.deleteAccountSuccess'));
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (e) {
      setDeleteMsg(t('account.deleteAccountError'));
      setDeleting(false);
    }
  };

  // Notificatie- en privacyvoorkeuren opslaan
  const handlePrefsSave = async () => {
    if (!user || !user.id) return;
    setPrefsSaving(true);
    setPrefsMsg(null);
    const { error } = await supabase.from('profiles').update({ wants_updates: wantsUpdates, is_private: isPrivate }).eq('id', user.id);
    if (error) {
      setPrefsMsg(t('account.errorSaveFailed'));
    } else {
      setPrefsMsg(t('account.saveSuccess'));
    }
    setPrefsSaving(false);
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
          {t('account.hello')}, {displayName}!
        </h1>
        {user ? (
          <>
            <div className="flex flex-col gap-4 items-center mb-4">
              {/* Naam wijzigen */}
              <div className="w-full max-w-xs text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('account.nameLabel')}</label>
                <input
                  type="text"
                  className="input-field w-full"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={nameSaving}
                />
                <button
                  className="btn-secondary mt-2 w-full flex items-center justify-center"
                  onClick={handleNameSave}
                  disabled={nameSaving}
                  type="button"
                >
                  {nameSaving ? (
                    <span className="animate-spin mr-2 w-5 h-5 border-2 border-primary-600 border-t-[#ff914d] rounded-full inline-block"></span>
                  ) : null}
                  {nameSaving ? t('common.loading') : t('account.save')}
                </button>
                {nameMsg && <div className="text-sm mt-1 text-green-700">{nameMsg}</div>}
              </div>
              {/* E-mail wijzigen */}
              <div className="w-full max-w-xs text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('account.emailLabel')}</label>
                <input
                  type="email"
                  className="input-field w-full"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={emailSaving}
                />
                <button
                  className="btn-secondary mt-2 w-full flex items-center justify-center"
                  onClick={handleEmailSave}
                  disabled={emailSaving}
                  type="button"
                >
                  {emailSaving ? (
                    <span className="animate-spin mr-2 w-5 h-5 border-2 border-primary-600 border-t-[#ff914d] rounded-full inline-block"></span>
                  ) : null}
                  {emailSaving ? t('common.loading') : t('account.save')}
                </button>
                {emailMsg && <div className="text-sm mt-1 text-green-700">{emailMsg}</div>}
              </div>
              {/* Wachtwoord wijzigen */}
              <form className="w-full max-w-xs text-left" onSubmit={handlePasswordSave} autoComplete="off">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('account.changePassword')}</label>
                <input
                  type="password"
                  className="input-field w-full mb-1"
                  placeholder={t('account.currentPassword')}
                  value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                  autoComplete="current-password"
                  disabled={pwSaving}
                />
                <input
                  type="password"
                  className="input-field w-full mb-1"
                  placeholder={t('account.newPassword')}
                  value={pwForm.new}
                  onChange={e => setPwForm(f => ({ ...f, new: e.target.value }))}
                  autoComplete="new-password"
                  disabled={pwSaving}
                />
                <input
                  type="password"
                  className="input-field w-full mb-1"
                  placeholder={t('account.confirmNewPassword')}
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  autoComplete="new-password"
                  disabled={pwSaving}
                />
                <button
                  className="btn-secondary mt-2 w-full flex items-center justify-center"
                  type="submit"
                  disabled={pwSaving}
                >
                  {pwSaving ? (
                    <span className="animate-spin mr-2 w-5 h-5 border-2 border-primary-600 border-t-[#ff914d] rounded-full inline-block"></span>
                  ) : null}
                  {pwSaving ? t('common.loading') : t('account.saveChanges')}
                </button>
                {pwMsg && <div className="text-sm mt-1 text-green-700">{pwMsg}</div>}
              </form>
            </div>
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
                aria-label={t('account.chooseEmojiAria', { emoji })}
              >
                {emojiSaving && selectedEmoji === emoji ? (
                  <span className="animate-spin w-5 h-5 border-2 border-primary-600 border-t-[#ff914d] rounded-full inline-block"></span>
                ) : emoji}
              </button>
            ))}
            <button
              type="button"
              className="ml-2 px-4 py-3 rounded-full border-4 border-[#b2dfdb] bg-[#e0f7fa] text-2xl font-bold shadow-sm hover:bg-[#b2dfdb]/60 transition-all duration-150"
              onClick={handleShuffleEmoji}
              disabled={emojiSaving}
              aria-label={t('account.shuffleEmojiAria')}
              title={t('account.shuffleEmojiAria')}
            >
              {emojiSaving ? (
                <span className="animate-spin w-5 h-5 border-2 border-primary-600 border-t-[#ff914d] rounded-full inline-block"></span>
              ) : '🔀'}
            </button>
          </div>
          {emojiSaving && <div className="text-xs text-gray-500 mt-2">{t('account.saving')}</div>}
          {/* Gender: informeel tonen of dropdown */}
          <div className="mt-8 mb-2 text-left">
            {gender && !showGenderDropdown ? (
              <div className="flex flex-col gap-2">
                <div className="text-lg font-medium text-gray-700">
                  {t('account.chosenGender')}: <span className="font-bold text-primary-700">{genderOptions.find(opt => opt.value === gender)?.label || gender}</span> 🎉
                </div>
                <button
                  type="button"
                  className="btn-secondary w-fit px-4 py-1 text-sm"
                  onClick={() => setShowGenderDropdown(true)}
                >
                  {t('account.changeGender')}
                </button>
              </div>
            ) : (
              <div>
                <label htmlFor="gender-select" className="block text-lg font-medium text-gray-700 mb-2">
                  {t('account.genderLabel')}
                </label>
                <select
                  id="gender-select"
                  value={pendingGender}
                  onChange={handleGenderSelect}
                  className="input-field mt-1 w-full max-w-xs"
                  disabled={genderSaving}
                >
                  <option value="">{t('account.selectGender')}</option>
                  {genderOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  className="btn-secondary mt-2 flex items-center justify-center"
                  type="button"
                  onClick={handleGenderSave}
                  disabled={genderSaving || pendingGender === gender}
                >
                  {genderSaving ? (
                    <span className="animate-spin mr-2 w-5 h-5 border-2 border-primary-600 border-t-[#ff914d] rounded-full inline-block"></span>
                  ) : null}
                  {genderSaving ? t('common.loading') : t('account.save')}
                </button>
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
              value={pendingAge}
              onChange={handleAgeInput}
              disabled={ageSaving}
              placeholder={t('common.age')}
            />
            <button
              className="btn-secondary mt-2 flex items-center justify-center"
              type="button"
              onClick={handleAgeSave}
              disabled={ageSaving || pendingAge === age}
            >
              {ageSaving ? (
                <span className="animate-spin mr-2 w-5 h-5 border-2 border-primary-600 border-t-[#ff914d] rounded-full inline-block"></span>
              ) : null}
              {ageSaving ? t('common.loading') : t('account.save')}
            </button>
            {ageMsg && <div className="text-sm mt-2 text-green-700">{ageMsg}</div>}
          </div>
          {/* Meetups lijst */}
          {myMeetups.length > 0 && (
            <div className="mt-10 w-full">
              <h3 className="text-lg font-bold mb-2">{t('account.myMeetups')}</h3>
              {meetupsLoading && <div className="text-gray-500 flex items-center gap-2"><span className="animate-spin w-5 h-5 border-2 border-primary-600 border-t-[#ff914d] rounded-full inline-block"></span> {t('common.loading')}</div>}
              {meetupsError && <div className="text-red-500">{t('account.errorLoadingMeetups')}</div>}
              <ul>
                {myMeetups.map(m => (
                  <li key={m.id} className="mb-2 p-3 bg-white rounded shadow flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="font-semibold">{m.selected_date}</span>
                      {m.selected_time && <span> &bull; {m.selected_time}</span>}
                      {m.cafe_name && <span> &bull; {m.cafe_name}</span>}
                      {!m.cafe_name && m.cafe_id && <span> &bull; Café {m.cafe_id}</span>}
                    </div>
                    <span className="text-xs text-gray-600 mt-1 sm:mt-0">{m.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Account verwijderen sectie */}
          <div className="mt-12 w-full flex flex-col items-center">
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition-all text-base flex items-center justify-center"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
            >
              {deleting ? (
                <span className="animate-spin mr-2 w-5 h-5 border-2 border-white border-t-[#ff914d] rounded-full inline-block"></span>
              ) : null}
              {deleting ? t('common.loading') : t('account.deleteAccount')}
            </button>
            {showDeleteConfirm && (
              <div className="bg-white border border-red-300 rounded-xl p-6 mt-4 max-w-md w-full text-center shadow-xl">
                <div className="text-red-700 font-semibold mb-4">{t('account.deleteAccountConfirm')}</div>
                <div className="flex gap-4 justify-center">
                  <button
                    className="btn-secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                  >
                    {t('account.deleteAccountCancel')}
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition-all text-base flex items-center justify-center"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <span className="animate-spin mr-2 w-5 h-5 border-2 border-white border-t-[#ff914d] rounded-full inline-block"></span>
                    ) : null}
                    {deleting ? t('common.loading') : t('account.deleteAccount')}
                  </button>
                </div>
                {deleteMsg && <div className="mt-4 text-sm text-red-700">{deleteMsg}</div>}
              </div>
            )}
          </div>
          {/* Notificatie- en privacyvoorkeuren */}
          <div className="bg-white/70 rounded-3xl p-6 shadow text-center mt-8 w-full border-2 border-[#b2dfdb]/40">
            <h2 className="text-xl font-bold text-primary-700 mb-2">{t('account.preferencesTitle')}</h2>
            <div className="flex flex-col gap-4 items-start max-w-xs mx-auto">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={wantsUpdates}
                  onChange={e => setWantsUpdates(e.target.checked)}
                  className="h-5 w-5 text-primary-600 rounded"
                  disabled={prefsSaving}
                />
                <span>{t('account.prefUpdates')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                  className="h-5 w-5 text-primary-600 rounded"
                  disabled={prefsSaving}
                />
                <span>{t('account.prefPrivate')}</span>
              </label>
              <button
                className="btn-secondary mt-2 flex items-center justify-center"
                type="button"
                onClick={handlePrefsSave}
                disabled={prefsSaving}
              >
                {prefsSaving ? (
                  <span className="animate-spin mr-2 w-5 h-5 border-2 border-primary-600 border-t-[#ff914d] rounded-full inline-block"></span>
                ) : null}
                {prefsSaving ? t('common.loading') : t('account.save')}
              </button>
              {prefsMsg && <div className="text-sm mt-2 text-green-700">{prefsMsg}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account; 