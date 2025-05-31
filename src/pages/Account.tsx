import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import SkeletonLoader from '../components/SkeletonLoader';
import React from 'react';
import FormStatus from '../components/FormStatus';
import Toast from '../components/Toast';

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
  const [age, setAge] = useState<number | ''>('');
  const [ageSaving, setAgeSaving] = useState(false);
  const [myMeetups, setMyMeetups] = useState<Invitation[]>([]);
  const [meetupsLoading, setMeetupsLoading] = useState(false);
  const [meetupsError, setMeetupsError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pendingGender, setPendingGender] = useState<string>('');
  const [pendingAge, setPendingAge] = useState<number | ''>('');
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [editGender, setEditGender] = useState(false);
  const [editAge, setEditAge] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [showProfileToast, setShowProfileToast] = useState(false);
  const [showPasswordToast, setShowPasswordToast] = useState(false);

  const EMOJI_OPTIONS = ['😃','😎','🧑‍🎤','🦄','🐱','🐶','☕️','🌈','💡','❤️'];
  const genderOptions = t('common.genderOptions', { returnObjects: true }) as { value: string, label: string }[];

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
        if (testProfiles.emoji) setSelectedEmoji(testProfiles.emoji);
        if (testProfiles.gender) setGender(testProfiles.gender);
        if (testProfiles.age !== undefined && testProfiles.age !== null) setAge(testProfiles.age);
        setWantsUpdates(!!testProfiles.wants_updates);
        setIsPrivate(!!testProfiles.is_private);
      } else {
        setUser(null);
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

  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      const content = viewport.getAttribute('content');
      if (content && !content.includes('maximum-scale')) {
        viewport.setAttribute('content', content + ', maximum-scale=1.0');
      }
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (!user || !user.id) {
      return;
    }
    const { error } = await supabase.from('profiles').update({ emoji }).eq('id', user.id);
    if (error) {
      console.error('Fout bij opslaan emoji:', error);
    } else {
      setSelectedEmoji(emoji);
      window.dispatchEvent(new Event('profile-emoji-updated'));
    }
  };

  const handleGenderSave = async () => {
    if (!user || !user.id) {
      return;
    }
    setGenderSaving(true);
    const { error } = await supabase.from('profiles').update({ gender: pendingGender }).eq('id', user.id);
    if (error) {
      console.error('Fout bij opslaan gender:', error);
    } else {
      setGender(pendingGender);
      setEditGender(false);
      setShowProfileToast(true);
    }
    setGenderSaving(false);
  };

  const handleAgeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') setPendingAge('');
    else if (/^\d{0,3}$/.test(val)) setPendingAge(Number(val));
  };

  const handleAgeSave = async () => {
    if (!user || !user.id) return;
    setAgeSaving(true);
    const value = pendingAge === '' ? null : pendingAge;
    const { error } = await supabase.from('profiles').update({ age: value }).eq('id', user.id);
    if (error) {
      console.error('Fout bij opslaan age:', error);
    } else {
      setAge(pendingAge);
      setShowProfileToast(true);
    }
    setAgeSaving(false);
  };

  // Profielnaam wijzigen
  const handleNameSave = async () => {
    if (!user || !user.id) return;
    if (!name.trim()) {
      return;
    }
    setNameSaving(true);
    // Update in profiles
    const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user.id);
    // Update in user_metadata
    const { error: metaError } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    if (error || metaError) {
      console.error('Fout bij opslaan naam:', error || metaError);
    } else {
      setShowProfileToast(true);
    }
    setNameSaving(false);
  };

  // E-mail wijzigen
  const handleEmailSave = async () => {
    if (!user) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return;
    }
    setEmailSaving(true);
    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      console.error('Fout bij opslaan email:', error);
    } else {
      setShowProfileToast(true);
    }
    setEmailSaving(false);
  };

  // Wachtwoord wijzigen
  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new.length < 8) {
      return;
    }
    if (pwForm.new !== pwForm.confirm) {
      return;
    }
    setPwForm({ current: '', new: '', confirm: '' });
    setShowPasswordToast(true);
  };

  // Account verwijderen
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) {
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
        console.error('Fout bij verwijderen account:', data.message || data.toString());
        return;
      }
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (e) {
      console.error('Onverwachte fout bij verwijderen account:', e);
    }
    setDeleting(false);
  };

  // Notificatie- en privacyvoorkeuren opslaan
  const handlePrefsSave = async () => {
    if (!user || !user.id) return;
    setPrefsSaving(true);
    const { error } = await supabase.from('profiles').update({ wants_updates: wantsUpdates, is_private: isPrivate }).eq('id', user.id);
    if (error) {
      console.error('Fout bij opslaan voorkeuren:', error);
    } else {
      setShowProfileToast(true);
    }
    setPrefsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2f1] to-[#b2dfdb]">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-[#37474f] mb-8">{t('account.accountTitle')}</h1>

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
            <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('account.preferences')}</h2>
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
            <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('account.password')}</h2>
            {showPwForm ? (
              <form onSubmit={handlePasswordSave} className="space-y-6">
                <div className="flex flex-col gap-4">
                  <input
                    type="password"
                    placeholder={t('account.currentPassword')}
                    value={pwForm.current}
                    onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                    className="input-field"
                    autoFocus
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
                <FormStatus status={nameSaving ? 'loading' : nameSaving === false && pwForm.current && pwForm.new && pwForm.confirm ? 'success' : 'idle'} message={t('account.passwordChangeSuccess')} />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    className="btn-primary active:scale-95 active:bg-[#b2dfdb] flex-1"
                  >
                    {t('common.save')}
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
            <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('account.myMeetups')}</h2>
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
            <h2 className="text-2xl font-bold text-red-500 mb-6">{t('account.dangerZone')}</h2>
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
              {t('auth.logout')}
            </button>
          </div>

          {showProfileToast && (
            <Toast
              message={t('toast.profileUpdated')}
              type="success"
              onClose={() => setShowProfileToast(false)}
            />
          )}
          {showPasswordToast && (
            <Toast
              message={t('toast.passwordChanged')}
              type="success"
              onClose={() => setShowPasswordToast(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const MeetupListItem = React.memo(function MeetupListItem({ m, t, statusLabels }: { m: Invitation, t: any, statusLabels: Record<string, string> }) {
  return (
    <li key={m.id} className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-primary-100 mb-2 transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 w-full">
        <div className="font-semibold text-primary-700 min-w-[110px]">{m.selected_date}{m.selected_time && <span> &bull; {m.selected_time}</span>}</div>
        <div className="text-gray-700 flex-1 truncate">
          <span className="font-medium">{t('common.cafe').toLowerCase()}:</span> {m.cafe_name || t('common.unknownCafe')}
        </div>
        <div className="text-gray-700 flex-1 truncate">
          <span className="font-medium">{t('account.contactPerson').toLowerCase()}:</span> {m.email_b || t('account.unknownContact')}
        </div>
      </div>
      <span className={`text-xs mt-2 sm:mt-0 px-3 py-1 rounded-full font-semibold ${m.status === 'confirmed' ? 'bg-green-100 text-green-700' : m.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : m.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>{statusLabels[m.status] || m.status}</span>
    </li>
  );
});

const MeetupsList = ({ meetups, t }: { meetups: Invitation[], t: any }) => {
  const statusLabels: Record<string, string> = {
    confirmed: t('account.status.confirmed', 'Confirmed'),
    pending: t('account.status.pending', 'Pending'),
    cancelled: t('account.status.cancelled', 'Cancelled'),
    declined: t('account.status.declined', 'Declined'),
  };
  const parseDate = (dateStr: string) => new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const upcoming = useMemo(() =>
    meetups.filter(m => parseDate(m.selected_date) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      .sort((a, b) => parseDate(a.selected_date).getTime() - parseDate(b.selected_date).getTime())
  , [meetups]);
  const past = useMemo(() =>
    meetups.filter(m => parseDate(m.selected_date) < new Date(now.getFullYear(), now.getMonth(), now.getDate()))
      .sort((a, b) => parseDate(b.selected_date).getTime() - parseDate(a.selected_date).getTime())
  , [meetups]);
  return (
    <div className="flex flex-col gap-6">
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-primary-700 mb-2">{t('account.upcomingMeetups')}</h3>
          <ul className="space-y-2">
            {upcoming.map(m => <MeetupListItem key={m.id} m={m} t={t} statusLabels={statusLabels} />)}
          </ul>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-primary-700 mb-2">{t('account.pastMeetups')}</h3>
          <ul className="space-y-2">
            {past.map(m => <MeetupListItem key={m.id} m={m} t={t} statusLabels={statusLabels} />)}
          </ul>
        </div>
      )}
      {upcoming.length === 0 && past.length === 0 && (
        <div className="text-gray-600 text-center py-8">{t('dashboard.noMeetups')}</div>
      )}
    </div>
  );
};

export default Account; 