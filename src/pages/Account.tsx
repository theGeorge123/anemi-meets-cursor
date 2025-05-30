import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import LoadingIndicator from '../components/LoadingIndicator';
import SkeletonLoader from '../components/SkeletonLoader';
import React from 'react';

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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Fout bij ophalen sessie:', sessionError);
        setMeetupsError(t('account.errorSession'));
        setMeetupsLoading(false);
        return;
      }
      if (!session?.user) {
        navigate('/login');
        return;
      }
      // Haal profiel op
      const { data: testProfiles, error: testProfilesError } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (testProfilesError) {
        console.error('Fout bij ophalen profiel:', testProfilesError);
      }
      if (testProfiles) {
        setUser(testProfiles as Profile);
        setDisplayName(testProfiles.full_name || generateRandomName());
        if (testProfiles.emoji) setSelectedEmoji(testProfiles.emoji);
        if (testProfiles.gender) setGender(testProfiles.gender);
        if (testProfiles.age !== undefined && testProfiles.age !== null) setAge(testProfiles.age);
        setWantsUpdates(!!testProfiles.wants_updates);
        setIsPrivate(!!testProfiles.is_private);
      } else {
        setUser(null);
        setDisplayName(generateRandomName());
      }
      setEmail(session.user.email || '');
      setName(session.user.user_metadata?.full_name || '');
      // Haal meetups op
      setMeetupsLoading(true);
      setMeetupsError(null);
      try {
        const { data: meetups, error: meetupsError } = await supabase
          .from('invitations')
          .select('id, selected_date, selected_time, cafe_id, cafe_name, status, email_b')
          .or(`invitee_id.eq.${session.user.id},email_b.eq.${session.user.email}`);
        if (meetupsError) {
          console.error('Fout bij ophalen meetups:', meetupsError.message);
          setMeetupsError(t('account.errorLoadingMeetupsDetails', { details: meetupsError.message }));
          setMyMeetups([]);
        } else {
          setMyMeetups((meetups || []) as Invitation[]);
        }
      } catch (err: any) {
        console.error('Onverwachte fout bij ophalen meetups:', err);
        setMeetupsError(t('account.errorLoadingMeetupsDetails', { details: err.message || err.toString() }));
        setMyMeetups([]);
      }
      setMeetupsLoading(false);
    };
    getUser();
    setPendingGender(gender);
    setPendingAge(age);
  }, [navigate, t]);

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
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2f1] to-[#b2dfdb]">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="mobile-heading text-[#37474f] mb-8">{t('account.title')}</h1>

          {/* Profile Section */}
          <div className="card mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="text-6xl mb-4">{selectedEmoji || '👤'}</div>
                <div className="grid grid-cols-5 gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-10 h-10 text-2xl hover:scale-110 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 w-full">
                <div className="space-y-6">
                  {/* Name */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <label className="w-full sm:w-32 font-semibold">{t('account.name')}</label>
                    {editName ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="input-field flex-1"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleNameSave}
                            disabled={nameSaving}
                            className="btn-primary active:scale-95 active:bg-[#b2dfdb]"
                          >
                            {nameSaving ? t('common.saving') : t('common.save')}
                          </button>
                          <button
                            onClick={() => setEditName(false)}
                            className="btn-secondary"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <span className="mobile-text">{name}</span>
                        <button
                          onClick={() => setEditName(true)}
                          className="btn-secondary"
                        >
                          {t('common.edit')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <label className="w-full sm:w-32 font-semibold">{t('account.email')}</label>
                    {editEmail ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-field flex-1"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleEmailSave}
                            disabled={emailSaving}
                            className="btn-primary active:scale-95 active:bg-[#b2dfdb]"
                          >
                            {emailSaving ? t('common.saving') : t('common.save')}
                          </button>
                          <button
                            onClick={() => setEditEmail(false)}
                            className="btn-secondary"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <span className="mobile-text">{email}</span>
                        <button
                          onClick={() => setEditEmail(true)}
                          className="btn-secondary"
                        >
                          {t('common.edit')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <label className="w-full sm:w-32 font-semibold">{t('account.gender')}</label>
                    {editGender ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <select
                          value={pendingGender}
                          onChange={(e) => setPendingGender(e.target.value)}
                          className="input-field flex-1"
                        >
                          <option value="">{t('common.select')}</option>
                          {genderOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={handleGenderSave}
                            disabled={genderSaving}
                            className="btn-primary active:scale-95 active:bg-[#b2dfdb]"
                          >
                            {genderSaving ? t('common.saving') : t('common.save')}
                          </button>
                          <button
                            onClick={() => setEditGender(false)}
                            className="btn-secondary"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <span className="mobile-text">
                          {genderOptions.find((opt) => opt.value === gender)?.label || t('common.notSpecified')}
                        </span>
                        <button
                          onClick={() => setEditGender(true)}
                          className="btn-secondary"
                        >
                          {t('common.edit')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Age */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <label className="w-full sm:w-32 font-semibold">{t('account.age')}</label>
                    {editAge ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <input
                          type="number"
                          value={pendingAge}
                          onChange={handleAgeInput}
                          className="input-field flex-1"
                          min="0"
                          max="120"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleAgeSave}
                            disabled={ageSaving}
                            className="btn-primary active:scale-95 active:bg-[#b2dfdb]"
                          >
                            {ageSaving ? t('common.saving') : t('common.save')}
                          </button>
                          <button
                            onClick={() => setEditAge(false)}
                            className="btn-secondary"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <span className="mobile-text">{age || t('common.notSpecified')}</span>
                        <button
                          onClick={() => setEditAge(true)}
                          className="btn-secondary"
                        >
                          {t('common.edit')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="card mb-8">
            <h2 className="mobile-heading text-[#37474f] mb-6">{t('account.preferences')}</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="wantsUpdates"
                  checked={wantsUpdates}
                  onChange={(e) => setWantsUpdates(e.target.checked)}
                  className="w-5 h-5"
                />
                <label htmlFor="wantsUpdates" className="mobile-text">
                  {t('account.wantsUpdates')}
                </label>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-5 h-5"
                />
                <label htmlFor="isPrivate" className="mobile-text">
                  {t('account.isPrivate')}
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handlePrefsSave}
                  disabled={prefsSaving}
                  className="btn-primary active:scale-95 active:bg-[#b2dfdb]"
                >
                  {prefsSaving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="card mb-8">
            <h2 className="mobile-heading text-[#37474f] mb-6">{t('account.password')}</h2>
            {showPwForm ? (
              <form onSubmit={handlePasswordSave} className="space-y-6">
                <div className="flex flex-col gap-4">
                  <input
                    type="password"
                    placeholder={t('account.currentPassword')}
                    value={pwForm.current}
                    onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="password"
                    placeholder={t('account.newPassword')}
                    value={pwForm.new}
                    onChange={(e) => setPwForm({ ...pwForm, new: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="password"
                    placeholder={t('account.confirmPassword')}
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    disabled={pwSaving}
                    className="btn-primary active:scale-95 active:bg-[#b2dfdb] flex-1"
                  >
                    {pwSaving ? t('common.saving') : t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPwForm(false)}
                    className="btn-secondary active:scale-95 active:bg-[#b2dfdb] flex-1"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowPwForm(true)}
                className="btn-secondary active:scale-95 active:bg-[#b2dfdb]"
              >
                {t('account.changePassword')}
              </button>
            )}
          </div>

          {/* My Meetups Section */}
          <div className="card mb-8">
            <h2 className="mobile-heading text-[#37474f] mb-6">{t('account.myMeetups')}</h2>
            {meetupsLoading ? (
              <SkeletonLoader />
            ) : meetupsError ? (
              <div className="text-red-500">{meetupsError}</div>
            ) : (
              <MeetupsList meetups={myMeetups} t={t} />
            )}
          </div>

          {/* Danger Zone */}
          <div className="card border-2 border-red-500">
            <h2 className="mobile-heading text-red-500 mb-6">{t('account.dangerZone')}</h2>
            {showDeleteConfirm ? (
              <div className="space-y-4">
                <p className="mobile-text text-red-500">{t('account.deleteConfirm')}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="btn-primary bg-red-500 hover:bg-red-600 active:scale-95 active:bg-[#b2dfdb] flex-1"
                  >
                    {deleting ? t('common.deleting') : t('account.confirmDelete')}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-secondary active:scale-95 active:bg-[#b2dfdb] flex-1"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn-secondary text-red-500 border-red-500 hover:bg-red-50 active:scale-95 active:bg-[#b2dfdb]"
              >
                {t('account.deleteAccount')}
              </button>
            )}
          </div>

          {/* Logout Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleLogout}
              className="btn-secondary active:scale-95 active:bg-[#b2dfdb]"
            >
              {t('account.logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Gememoizeerd lijstitem
const MeetupListItem = React.memo(function MeetupListItem({ m, t }: { m: Invitation, t: any }) {
  return (
    <li key={m.id} className="bg-[#fff7f3] rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-[#ff914d]/10 mb-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 w-full">
        <div className="font-semibold text-primary-700 min-w-[110px]">{m.selected_date}{m.selected_time && <span> &bull; {m.selected_time}</span>}</div>
        <div className="text-gray-700 flex-1 truncate">
          <span className="font-medium">{t('common.cafe').toLowerCase()}:</span> {m.cafe_name || (m.cafe_id ? t('common.unknownCafe') : t('common.noCafe'))}
        </div>
        <div className="text-gray-700 flex-1 truncate">
          <span className="font-medium">{t('account.contactPerson').toLowerCase()}:</span> {m.email_b || t('account.unknownContact')}
        </div>
      </div>
      <span className={`text-xs mt-2 sm:mt-0 px-3 py-1 rounded-full font-semibold ${m.status === 'confirmed' ? 'bg-green-100 text-green-700' : m.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'}`}>{t(`account.status.${m.status}`)}</span>
    </li>
  );
});

const MeetupsList = ({ meetups, t }: { meetups: Invitation[], t: any }) => {
  // Helper om datum te parsen en te vergelijken
  const parseDate = (dateStr: string) => {
    // Verwacht formaat: YYYY-MM-DD
    return new Date(dateStr + 'T00:00:00');
  };
  const now = new Date();

  // useMemo voor gefilterde/sorteerde lijsten
  const upcoming = useMemo(() =>
    meetups
      .filter(m => parseDate(m.selected_date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      .sort((a, b) => parseDate(b.selected_date).getTime() - parseDate(a.selected_date).getTime())
  , [meetups]);

  const past = useMemo(() =>
    meetups
      .filter(m => parseDate(m.selected_date) < new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      .sort((a, b) => parseDate(b.selected_date).getTime() - parseDate(a.selected_date).getTime())
  , [meetups]);

  // Voorbeeld virtualisatie (optioneel, alleen bij grote lijsten):
  // import { FixedSizeList as List } from 'react-window';
  // <List height={400} itemCount={upcoming.length} itemSize={80} width="100%">
  //   {({ index, style }) => (
  //     <div style={style}>
  //       <MeetupListItem m={upcoming[index]} t={t} />
  //     </div>
  //   )}
  // </List>

  return (
    <div className="flex flex-col gap-6">
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-primary-700 mb-2">{t('account.upcomingMeetups')}</h3>
          <ul className="space-y-2">
            {upcoming.map(m => <MeetupListItem key={m.id} m={m} t={t} />)}
          </ul>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-primary-700 mb-2">{t('account.pastMeetups')}</h3>
          <ul className="space-y-2">
            {past.map(m => <MeetupListItem key={m.id} m={m} t={t} />)}
          </ul>
        </div>
      )}
      {upcoming.length === 0 && past.length === 0 && (
        <div className="text-gray-600 text-center">{t('dashboard.noMeetups').toLowerCase() || 'nog geen meetups gepland. waarom niet?'}</div>
      )}
    </div>
  );
};

export default Account; 