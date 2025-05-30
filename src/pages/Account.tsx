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
  const [gender, setGender] = useState<string>('');
  const [genderSaving, setGenderSaving] = useState(false);
  const [genderMsg, setGenderMsg] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
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
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [editGender, setEditGender] = useState(false);
  const [editAge, setEditAge] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);

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
      setEditGender(false);
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
    <div className="max-w-2xl mx-auto py-8 px-2 flex flex-col gap-8">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-[#fff7f3] to-[#b2dfdb]/30 rounded-3xl shadow-xl p-8 flex flex-col items-center gap-2 border border-[#ff914d]/20">
        <div className="text-6xl mb-2">{selectedEmoji || '👤'}</div>
        <div className="text-2xl font-bold text-primary-700 flex items-center gap-2">{displayName}</div>
        <div className="text-base text-gray-600 mb-2">{email}</div>
        <button
          className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl mt-2"
          onClick={handleLogout}
        >
          <span>🚪</span> {t('account.logout')}
        </button>
      </div>

      {/* Profile Info Section */}
      <div className="bg-white/90 rounded-2xl shadow p-6 flex flex-col gap-6 border border-[#b2dfdb]/30">
        <h2 className="text-xl font-bold text-primary-700 mb-2 flex items-center gap-2">📝 {t('account.profileInfo').toLowerCase() || 'Profielinformatie'}</h2>
        {/* Name */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">{t('account.nameLabel').toLowerCase()}:</span>
            {!editName ? (
              <>
                <span className="text-primary-700 font-semibold">{name}</span>
                <button className="btn-secondary px-3 py-1 ml-2" onClick={() => setEditName(true)}>naam wijzigen</button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  className="input-field rounded-xl"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={nameSaving}
                  autoFocus
                />
                <div className="text-xs text-gray-500 mt-1">{t('account.nameEditHint').toLowerCase() || 'Naam verkeerd gespeld? Pas hier aan!'}</div>
                <div className="flex gap-2 mt-1">
                  <button className="btn-primary px-4 py-1" onClick={handleNameSave} disabled={nameSaving}>opslaan</button>
                  <button className="btn-secondary px-4 py-1" onClick={() => setEditName(false)}>annuleren</button>
                </div>
                {nameMsg && <div className="text-sm mt-1 text-green-700">✅ {nameMsg}</div>}
              </>
            )}
          </div>
        </div>
        {/* Email */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">{t('account.emailLabel').toLowerCase()}:</span>
            {!editEmail ? (
              <>
                <span className="text-primary-700 font-semibold">{email}</span>
                <button className="btn-secondary px-3 py-1 ml-2" onClick={() => setEditEmail(true)}>e-mail wijzigen</button>
              </>
            ) : (
              <>
                <input
                  type="email"
                  className="input-field rounded-xl"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={emailSaving}
                  autoFocus
                />
                <div className="text-xs text-gray-500 mt-1">{t('account.emailEditHint').toLowerCase() || 'E-mail verkeerd? Pas hier aan!'}</div>
                <div className="flex gap-2 mt-1">
                  <button className="btn-primary px-4 py-1" onClick={handleEmailSave} disabled={emailSaving}>opslaan</button>
                  <button className="btn-secondary px-4 py-1" onClick={() => setEditEmail(false)}>annuleren</button>
                </div>
                {emailMsg && <div className="text-sm mt-1 text-green-700">✅ {emailMsg}</div>}
              </>
            )}
          </div>
        </div>
        {/* Gender */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">{t('account.genderLabel').toLowerCase()}:</span>
            {!editGender ? (
              <>
                <span className="text-primary-700 font-semibold">{genderOptions.find(opt => opt.value === gender)?.label || gender || t('account.noGender').toLowerCase()}</span>
                <button className="btn-secondary px-3 py-1 ml-2" onClick={() => setEditGender(true)}>toch wijzigen?</button>
              </>
            ) : (
              <>
                <div className="flex gap-3 mt-1">
                  {genderOptions.map(opt => (
                    <label key={opt.value} className={`cursor-pointer px-4 py-2 rounded-xl border-2 font-medium ${pendingGender === opt.value ? 'bg-[#b2dfdb]/60 border-[#ff914d] text-primary-700' : 'bg-white border-gray-300 text-gray-700'} transition`}>
                      <input
                        type="radio"
                        name="gender"
                        value={opt.value}
                        checked={pendingGender === opt.value}
                        onChange={() => setPendingGender(opt.value)}
                        className="hidden"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-1">
                  <button className="btn-primary px-4 py-1" onClick={handleGenderSave} disabled={genderSaving}>opslaan</button>
                  <button className="btn-secondary px-4 py-1" onClick={() => setEditGender(false)}>annuleren</button>
                </div>
                {genderMsg && <div className="text-sm mt-1 text-green-700">✅ {genderMsg}</div>}
              </>
            )}
          </div>
        </div>
        {/* Age */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">{t('common.age').toLowerCase()}:</span>
            {!editAge ? (
              <>
                <span className="text-primary-700 font-semibold">{age || t('account.noAge').toLowerCase()}</span>
                <button className="btn-secondary px-3 py-1 ml-2" onClick={() => setEditAge(true)}>leeftijd wijzigen</button>
              </>
            ) : (
              <>
                <input
                  type="number"
                  min="0"
                  max="120"
                  className="input-field rounded-xl w-24"
                  value={pendingAge}
                  onChange={handleAgeInput}
                  disabled={ageSaving}
                  style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                />
                <div className="text-xs text-gray-500 mt-1">{t('account.ageEditHint').toLowerCase() || 'Leeftijd aanpassen? Scroll of typ hier.'}</div>
                <div className="flex gap-2 mt-1">
                  <button className="btn-primary px-4 py-1" onClick={handleAgeSave} disabled={ageSaving}>opslaan</button>
                  <button className="btn-secondary px-4 py-1" onClick={() => setEditAge(false)}>annuleren</button>
                </div>
                {ageMsg && <div className="text-sm mt-1 text-green-700">✅ {ageMsg}</div>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white/90 rounded-2xl shadow p-6 flex flex-col gap-4 border border-[#b2dfdb]/30">
        <h2 className="text-xl font-bold text-primary-700 mb-2 flex items-center gap-2">🔑 {t('account.changePassword').toLowerCase()}</h2>
        {!showPwForm ? (
          <button className="btn-secondary px-4 py-2 w-fit" onClick={() => setShowPwForm(true)}>{t('account.changePassword').toLowerCase()}</button>
        ) : (
          <form className="flex flex-col gap-2" onSubmit={handlePasswordSave} autoComplete="off">
            <input
              type="password"
              className="input-field w-full rounded-xl"
              placeholder={t('account.currentPassword').toLowerCase()}
              value={pwForm.current}
              onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
              autoComplete="current-password"
              disabled={pwSaving}
            />
            <input
              type="password"
              className="input-field w-full rounded-xl"
              placeholder={t('account.newPassword').toLowerCase()}
              value={pwForm.new}
              onChange={e => setPwForm(f => ({ ...f, new: e.target.value }))}
              autoComplete="new-password"
              disabled={pwSaving}
            />
            <input
              type="password"
              className="input-field w-full rounded-xl"
              placeholder={t('account.confirmNewPassword').toLowerCase()}
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              autoComplete="new-password"
              disabled={pwSaving}
            />
            <div className="flex gap-2 mt-1">
              <button className="btn-primary px-4 py-1" type="submit" disabled={pwSaving}>{t('account.saveChanges').toLowerCase()}</button>
              <button className="btn-secondary px-4 py-1" type="button" onClick={() => setShowPwForm(false)}>{t('account.cancel').toLowerCase()}</button>
            </div>
            {pwMsg && <div className="text-sm mt-1 text-green-700">✅ {pwMsg}</div>}
          </form>
        )}
      </div>

      {/* Preferences Section */}
      <div className="bg-white/90 rounded-2xl shadow p-6 flex flex-col gap-4 border border-[#b2dfdb]/30">
        <h2 className="text-xl font-bold text-primary-700 mb-2 flex items-center gap-2">⚙️ {t('account.preferencesTitle').toLowerCase()}</h2>
        <div className="flex flex-col gap-4 items-start max-w-xs mx-auto">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={wantsUpdates}
              onChange={e => setWantsUpdates(e.target.checked)}
              className="h-5 w-5 text-primary-600 rounded"
              disabled={prefsSaving}
            />
            <span>{t('account.prefUpdates').toLowerCase()}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={e => setIsPrivate(e.target.checked)}
              className="h-5 w-5 text-primary-600 rounded"
              disabled={prefsSaving}
            />
            <span>{t('account.prefPrivate').toLowerCase()}</span>
          </label>
          <button
            className="btn-secondary mt-2 flex items-center gap-2 px-4 py-2 rounded-xl"
            type="button"
            onClick={handlePrefsSave}
            disabled={prefsSaving}
          >
            <span>💾</span> {prefsSaving ? t('common.loading').toLowerCase() : t('account.save').toLowerCase()}
          </button>
          {prefsMsg && <div className="text-sm mt-2 text-green-700 flex items-center gap-1">✅ {prefsMsg}</div>}
        </div>
      </div>

      {/* Meetups Section */}
      <div className="bg-white/90 rounded-2xl shadow p-6 flex flex-col gap-4 border border-[#b2dfdb]/30">
        <h2 className="text-xl font-bold text-primary-700 mb-2 flex items-center gap-2">☕️ {t('account.myMeetups').toLowerCase()}</h2>
        {meetupsLoading && <div className="text-gray-500 flex items-center gap-2"><span className="animate-spin w-5 h-5 border-2 border-primary-600 border-t-[#ff914d] rounded-full inline-block"></span> {t('common.loading').toLowerCase()}</div>}
        {meetupsError && <div className="text-red-600 text-center">{meetupsError}</div>}
        {myMeetups.length === 0 && !meetupsLoading && !meetupsError && (
          <div className="text-gray-600 text-center">{t('dashboard.noMeetups').toLowerCase() || 'Nog geen meetups gepland. Waarom niet?'}</div>
        )}
        <ul className="space-y-3">
          {myMeetups.map(m => (
            <li key={m.id} className="bg-[#fff7f3] rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-[#ff914d]/10">
              <div>
                <span className="font-semibold text-primary-700">{m.selected_date}</span>
                {m.selected_time && <span> &bull; {m.selected_time}</span>}
                {m.cafe_name && <span> &bull; {m.cafe_name}</span>}
                {!m.cafe_name && m.cafe_id && <span> &bull; Café {m.cafe_id}</span>}
              </div>
              <span className={`text-xs mt-2 sm:mt-0 px-3 py-1 rounded-full font-semibold ${m.status === 'confirmed' ? 'bg-green-100 text-green-700' : m.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'}`}>{m.status}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Danger Zone Section */}
      <div className="bg-red-50 border border-red-200 rounded-2xl shadow p-6 flex flex-col gap-4 items-center">
        <h2 className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">⚠️ {t('account.deleteAccount').toLowerCase()}</h2>
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition-all text-base flex items-center gap-2 justify-center"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting}
        >
          <span>🗑️</span> {deleting ? t('common.loading').toLowerCase() : t('account.deleteAccount').toLowerCase()}
        </button>
        {showDeleteConfirm && (
          <div className="bg-white border border-red-300 rounded-xl p-6 mt-4 max-w-md w-full text-center shadow-xl">
            <div className="text-red-700 font-semibold mb-4">{t('account.deleteAccountConfirm').toLowerCase()}</div>
            <div className="flex gap-4 justify-center">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                {t('account.deleteAccountCancel').toLowerCase()}
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg transition-all text-base flex items-center gap-2 justify-center"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                <span>🗑️</span> {deleting ? t('common.loading').toLowerCase() : t('account.deleteAccount').toLowerCase()}
              </button>
            </div>
            {deleteMsg && <div className="mt-4 text-sm text-red-700">{deleteMsg}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Account; 