import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { Database } from '../types/supabase';
import { useTranslation } from 'react-i18next';
import type { TFunction, i18n as I18n } from 'i18next';
import SkeletonLoader from '../components/SkeletonLoader';
import React from 'react';
import FormStatus from '../components/FormStatus';
import Toast from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary';
import { requestBrowserNotificationPermission } from '../utils/browserNotifications';

// TypeScript interfaces voor typeveiligheid
type Profile = Database['public']['Tables']['profiles']['Row'];

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
  const [age, setAge] = useState<number | ''>('');
  const [myMeetups, setMyMeetups] = useState<Invitation[]>([]);
  const [meetupsLoading, setMeetupsLoading] = useState(false);
  const [meetupsError, setMeetupsError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [wantsReminders, setWantsReminders] = useState(true);
  const [wantsNotifications, setWantsNotifications] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [showProfileToast, setShowProfileToast] = useState(false);
  const [showPasswordToast, setShowPasswordToast] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const EMOJI_OPTIONS = ['😃','😎','🧑‍🎤','🦄','🐱','🐶','☕️','🌈','💡','❤️'];

  // Split emoji options into rows of 4 for better layout
  const EMOJI_ROWS = [];
  for (let i = 0; i < EMOJI_OPTIONS.length; i += 4) {
    EMOJI_ROWS.push(EMOJI_OPTIONS.slice(i, i + 4));
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Fout bij ophalen sessie:', sessionError);
        setMeetupsError(t('errorSession'));
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
        if (testProfiles.age !== undefined && testProfiles.age !== null) setAge(testProfiles.age);
        setWantsUpdates(!!testProfiles.wants_updates);
        setWantsReminders(testProfiles.wants_reminders !== false);
        setWantsNotifications(!!testProfiles.wants_notifications);
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
      } catch (err: unknown) {
        console.error('Onverwachte fout bij ophalen meetups:', err);
        const details = err instanceof Error ? err.message : String(err);
        setMeetupsError(t('account.errorLoadingMeetupsDetails', { details }));
        setMyMeetups([]);
      }
      setMeetupsLoading(false);
    };
    getUser();
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

  // Notificatie- en privacyvoorkeuren opslaan
  const handlePrefsSave = async () => {
    if (!user || !user.id) return;
    setPrefsSaving(true);
    if (wantsNotifications && Notification.permission !== 'granted') {
      await requestBrowserNotificationPermission();
    }
    const { error } = await supabase.from('profiles').update({
      wants_updates: wantsUpdates,
      wants_reminders: wantsReminders,
      wants_notifications: wantsNotifications,
      is_private: isPrivate
    }).eq('id', user.id);
    if (error) {
      console.error('Fout bij opslaan voorkeuren:', error);
    } else {
      setShowProfileToast(true);
    }
    setPrefsSaving(false);
  };

  const handleDeleteAccount = async () => {
    const confirmMsg = t('account.deleteConfirm', 'Are you sure? This cannot be undone!');
    if (!window.confirm(confirmMsg)) return;
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error || !sessionData.session?.access_token) {
      console.error('Failed to get session for deletion', error);
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        console.error('Delete account failed', body);
        return;
      }
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('Unexpected delete error', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2f1] to-[#b2dfdb]">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-primary-700 mb-8">{t('account.title')}</h1>

          {/* Emoji Section */}
          <div className="card mb-6 flex flex-col items-center">
            <div className="text-6xl mb-4">{selectedEmoji || '👤'}</div>
            <div className="flex flex-col gap-1">
              {EMOJI_ROWS.map((row, rowIdx) => (
                <div key={rowIdx} className="flex gap-1 justify-center">
                  {row.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-8 h-8 text-xl hover:scale-110 transition-transform p-0"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Emoji Section Label */}
          <div className="w-full text-center text-lg font-semibold mb-2 text-primary-700">{t('account.emoji')}</div>

          {/* Name Section */}
          <div className="card mb-4 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-0 w-full sm:w-32">
              <span className="text-xl" aria-hidden>📝</span>
              <span className="font-semibold">{t('account.name')}</span>
              <span className="text-xs text-gray-400 italic sm:ml-0 ml-2">{t('account.nameEditHint')}</span>
                  </div>
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
              <span className="mobile-text text-lg">{name || t('account.notSpecified')}</span>
            </div>
          </div>
          <hr className="my-2 border-gray-200" />

          {/* Email Section */}
          <div className="card mb-4 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-0 w-full sm:w-32">
              <span className="text-xl" aria-hidden>✉️</span>
              <span className="font-semibold">{t('account.email')}</span>
              <span className="text-xs text-gray-400 italic sm:ml-0 ml-2">{t('account.emailEditHint')}</span>
                  </div>
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
              <span className="mobile-text text-lg">{email || t('account.notSpecified')}</span>
            </div>
          </div>
          <hr className="my-2 border-gray-200" />

          {/* Age Section */}
          <div className="card mb-8 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-0 w-full sm:w-32">
              <span className="text-xl" aria-hidden>🎂</span>
              <span className="font-semibold">{t('account.age')}</span>
              <span className="text-xs text-gray-400 italic sm:ml-0 ml-2">{t('account.ageEditHint')}</span>
                  </div>
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
              <span className="mobile-text text-lg">{age !== '' ? age : 'immortal'}</span>
            </div>
          </div>
          <hr className="my-2 border-gray-200" />

          {/* Preferences Section */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('account.profileInfo')}</h2>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="w-full sm:w-32 font-semibold">{t('account.wantsUpdates')}</label>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wantsUpdates}
                      onChange={(e) => setWantsUpdates(e.target.checked)}
                    />
                    {t('account.wantsUpdatesCheckbox', 'Yeah, I want to receive updates!')}
                  </label>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="w-full sm:w-32 font-semibold">{t('account.wantsReminders')}</label>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wantsReminders}
                      onChange={(e) => setWantsReminders(e.target.checked)}
                    />
                    {t('account.wantsRemindersCheckbox', 'Yes, remind me before a meetup!')}
                  </label>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="w-full sm:w-32 font-semibold">{t('account.wantsNotifications')}</label>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wantsNotifications}
                      onChange={(e) => setWantsNotifications(e.target.checked)}
                    />
                    {t('account.wantsNotificationsCheckbox', 'Yes, allow browser notifications!')}
                  </label>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="w-full sm:w-32 font-semibold">{t('account.isPrivate')}</label>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                    />
                    {t('account.isPrivateCheckbox', 'Yeah, I want to keep my profile private!')}
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handlePrefsSave}
                  disabled={prefsSaving}
                  className="btn-primary active:scale-95 active:bg-primary-100"
                >
                  {prefsSaving ? t('account.saving') : t('account.save')}
                </button>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('account.password')}</h2>
            {showPwForm ? (
              <form onSubmit={e => e.preventDefault()} className="space-y-6">
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
                <FormStatus status={'idle'} message={t('account.passwordChangeSuccess')} />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    className="btn-primary active:scale-95 active:bg-primary-100 flex-1"
                  >
                    {t('account.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPwForm(false)}
                    className="btn-secondary active:scale-95 active:bg-primary-100 flex-1"
                  >
                    {t('account.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="w-full sm:w-32 font-semibold">{t('account.changePassword')}</label>
                <button
                  onClick={() => setShowPwForm(true)}
                  className="btn-secondary"
                >
                  {t('account.changePassword')}
                </button>
              </div>
            )}
          </div>

          {/* My Meetups Section */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('account.myMeetups')}</h2>
            {meetupsLoading ? (
              <SkeletonLoader />
            ) : meetupsError ? (
              <div className="text-red-500">{t('account.errorLoadingMeetupsDetails', { details: meetupsError })}</div>
            ) : (
              <MeetupsList meetups={myMeetups} t={t} i18n={i18n} />
            )}
          </div>

          {/* Danger Zone */}
          <div className="card border-2 border-red-500">
            <h2 className="text-2xl font-bold text-red-500 mb-6">{t('account.dangerZone')}</h2>
              <button
                onClick={handleDeleteAccount}
                className="btn-secondary text-red-500 border-red-500 hover:bg-red-50 active:scale-95 active:bg-primary-100"
              >
              {t('account.deleteAccount')}
              </button>
          </div>

          {/* Logout Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleLogout}
              className="btn-secondary active:scale-95 active:bg-primary-100"
            >
              {t('account.logout')}
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

interface MeetupListItemProps {
  m: Invitation;
  t: TFunction;
  statusLabels: Record<string, string>;
  i18n: I18n;
}

const MeetupListItem = React.memo(function MeetupListItem({ m, t, statusLabels, i18n }: MeetupListItemProps) {
  return (
    <li key={m.id} className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-primary-100 mb-2 transition hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 w-full">
        <div className="font-semibold text-primary-700 min-w-[110px]">{m.selected_date}{m.selected_time && <span> &bull; {m.selected_time}</span>}</div>
        <div className="text-gray-700 flex-1 truncate">
          <span className="font-medium">{i18n.language === 'nl' ? 'Café' : 'Cafe'}:</span> {m.cafe_name || (i18n.language === 'nl' ? 'Onbekend café' : 'Unknown cafe')}
        </div>
        <div className="text-gray-700 flex-1 truncate">
          <span className="font-medium">{t('account.contactPerson').toLowerCase()}:</span> {m.email_b || t('account.unknownContact')}
        </div>
      </div>
      <span className={`text-xs mt-2 sm:mt-0 px-3 py-1 rounded-full font-semibold ${m.status === 'confirmed' ? 'bg-green-100 text-green-700' : m.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : m.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>{statusLabels[m.status] || m.status}</span>
    </li>
  );
});

interface MeetupsListProps {
  meetups: Invitation[];
  t: TFunction;
  i18n: I18n;
}

const MeetupsList = ({ meetups, t, i18n }: MeetupsListProps) => {
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
            {upcoming.map(m => <MeetupListItem key={m.id} m={m} t={t} statusLabels={statusLabels} i18n={i18n} />)}
          </ul>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-primary-700 mb-2">{t('account.pastMeetups')}</h3>
          <ul className="space-y-2">
            {past.map(m => <MeetupListItem key={m.id} m={m} t={t} statusLabels={statusLabels} i18n={i18n} />)}
          </ul>
        </div>
      )}
      {upcoming.length === 0 && past.length === 0 && (
        <div className="text-gray-600 text-center py-8">{t('dashboard.noMeetups')}</div>
      )}
    </div>
  );
};

const AccountPageWithBoundary = () => (
  <ErrorBoundary>
    <Account />
  </ErrorBoundary>
);

export default AccountPageWithBoundary;
