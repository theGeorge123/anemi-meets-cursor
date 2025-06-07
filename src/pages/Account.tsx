import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getProfile, getAllBadges, getUserBadges } from '../services/supabaseService';
import { useTranslation } from 'react-i18next';
import FormStatus from '../components/FormStatus';
import Toast from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary';
import { requestBrowserNotificationPermission } from '../utils/browserNotifications';
import type { Badge, UserBadge } from '../types/supabase';

// TypeScript interfaces voor typeveiligheid
interface Profile {
  id: string;
  fullName: string;
  email: string;
  emoji?: string;
  gender?: string;
  age?: number;
  wantsUpdates: boolean;
  wantsReminders?: boolean;
  wantsNotifications?: boolean;
  isPrivate: boolean;
}

interface Invitation {
  id: string;
  selected_date: string;
  selected_time: string;
  cafe_id?: string;
  status: string;
  email_b?: string;
}

const Account = () => {
  const [user, setUser] = useState<Profile | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [age, setAge] = useState<number | ''>('');
  const [myMeetups, setMyMeetups] = useState<Invitation[]>([]);
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

  // Edit state for name/email/age
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editAge, setEditAge] = useState(age);

  const EMOJI_OPTIONS = ['😃','😎','🧑‍🎤','🦄','🐱','🐶','☕️','🌈','💡','❤️'];

  // Split emoji options into rows of 4 for better layout
  const EMOJI_ROWS = [];
  for (let i = 0; i < EMOJI_OPTIONS.length; i += 4) {
    EMOJI_ROWS.push(EMOJI_OPTIONS.slice(i, i + 4));
  }

  // State for generated friend invite link
  const [friendInviteLink, setFriendInviteLink] = useState<string>('');
  const [inviteGenerating, setInviteGenerating] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Find next upcoming meetup
  const nextMeetup = useMemo(() => {
    if (!myMeetups || myMeetups.length === 0) return null;
    const now = new Date();
    return myMeetups
      .filter(m => new Date(m.selected_date) >= now)
      .sort((a, b) => new Date(a.selected_date).getTime() - new Date(b.selected_date).getTime())[0] || null;
  }, [myMeetups]);

  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);

  // 1. Add state for emoji update loading and error
  const [emojiLoading, setEmojiLoading] = useState(false);
  const [emojiError, setEmojiError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Fout bij ophalen sessie:', sessionError);
        return;
      }
      if (!session?.user) {
        navigate('/login');
        return;
      }
      // Haal profiel op
      const { data: profileData, error: profileError } = await getProfile(session.user.id);
      if (profileError) {
        console.error('Fout bij ophalen profiel:', profileError);
      }
      if (profileData) {
        setUser(profileData as Profile);
        if (profileData.emoji) setSelectedEmoji(profileData.emoji);
        if (profileData.age !== undefined && profileData.age !== null) setAge(profileData.age);
        setWantsUpdates(!!profileData.wantsUpdates);
        setWantsReminders(profileData.wantsReminders !== false);
        setWantsNotifications(!!profileData.wantsNotifications);
        setIsPrivate(!!profileData.isPrivate);
      } else {
        setUser(null);
      }
      setEmail(session.user.email || '');
      setName(session.user.user_metadata?.full_name || '');
      // Haal meetups op
      try {
        const { data: meetups, error: meetupsError } = await supabase
          .from('invitations')
          .select('id, selected_date, selected_time, cafe_id, status, email_b')
          .or(`invitee_id.eq.${session.user.id},email_b.eq.${session.user.email}`);
        if (meetupsError) {
          console.error('Fout bij ophalen meetups:', meetupsError.message);
        } else {
          setMyMeetups((meetups || []) as Invitation[]);
        }
      } catch (err: unknown) {
        console.error('Onverwachte fout bij ophalen meetups:', err);
        setMyMeetups([]);
      }
      // Fetch badges
      if (session?.user) {
        const [allBadges, myBadges] = await Promise.all([
          getAllBadges(),
          getUserBadges(session.user.id)
        ]);
        setBadges(allBadges);
        setUserBadges(myBadges);
      }
    };
    getUser();
  }, [navigate]);

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

  // 2. Update handleEmojiSelect to handle loading and error
  const handleEmojiSelect = async (emoji: string) => {
    if (!user || !user.id) {
      return;
    }
    setEmojiLoading(true);
    setEmojiError(null);
    const { error } = await supabase.from('profiles').update({ emoji }).eq('id', user.id);
    if (error) {
      setEmojiError('Fout bij opslaan emoji. Probeer het opnieuw.');
      console.error('Fout bij opslaan emoji:', error);
    } else {
      setSelectedEmoji(emoji);
      window.dispatchEvent(new Event('profile-emoji-updated'));
    }
    setEmojiLoading(false);
  };

  // Notificatie- en privacyvoorkeuren opslaan
  const handlePrefsSave = async () => {
    if (!user || !user.id) return;
    setPrefsSaving(true);
    if (wantsNotifications && Notification.permission !== 'granted') {
      await requestBrowserNotificationPermission();
    }
    const { error } = await supabase.from('profiles').update({
      wantsUpdates,
      wantsReminders,
      wantsNotifications,
      isPrivate
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
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        }
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

  const handleProfileEdit = () => {
    setEditingProfile(true);
    setEditName(name);
    setEditEmail(email);
    setEditAge(age);
  };

  const handleProfileCancel = () => {
    setEditingProfile(false);
    setEditName(name);
    setEditEmail(email);
    setEditAge(age);
  };

  const handleProfileSave = async () => {
    if (!user || !user.id) return;
    // Update name and age in profiles table
    const { error } = await supabase.from('profiles').update({ fullName: editName, age: editAge }).eq('id', user.id);
    if (!error && editEmail !== email) {
      // Update email in auth
      const { error: emailError } = await supabase.auth.updateUser({ email: editEmail });
      if (emailError) {
        setShowProfileToast(false);
        alert(t('account.errorEmailUpdate', 'Could not update email.'));
        return;
      }
      setEmail(editEmail);
    }
    if (!error) {
      setName(editName);
      setAge(editAge);
      setShowProfileToast(true);
      setEditingProfile(false);
    } else {
      alert(t('account.errorProfileUpdate', 'Could not update profile.'));
    }
  };

  // BADGE DISPLAY
  const earnedKeys = new Set(userBadges.map(b => b.badge_key));

  // Handler to generate a friend invite link
  const handleGenerateFriendInvite = async () => {
    if (!user || !user.id) return;
    setInviteGenerating(true);
    setInviteError(null);
    try {
      // Call Supabase Edge Function to generate invite and get the link
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-friend-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ inviter_id: user.id, invitee_email: null, lang: (i18n?.language || 'nl') }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        setInviteError(t('account.inviteError', 'Kon uitnodigingslink niet genereren. Probeer het opnieuw.'));
      } else {
        setFriendInviteLink(`${window.location.origin}/invite-friend/${data.token}`);
      }
    } catch (err) {
      setInviteError(t('account.inviteError', 'Kon uitnodigingslink niet genereren. Probeer het opnieuw.'));
    }
    setInviteGenerating(false);
  };

  // Hardcode badges for testing
  useEffect(() => {
    setBadges([
      { id: 1, key: 'coffee', emoji: '☕️', label: 'Coffee Lover', description: 'Had your first meetup', created_at: '' },
      { id: 2, key: 'unicorn', emoji: '🦄', label: 'Unicorn', description: 'Planned a unique meetup', created_at: '' },
      { id: 3, key: 'party', emoji: '🎉', label: 'Party Starter', description: 'Invited 5 friends', created_at: '' },
      { id: 4, key: 'trophy', emoji: '🏆', label: 'Champion', description: 'Reached 10 meetups', created_at: '' },
      { id: 5, key: 'star', emoji: '🌟', label: 'Star', description: 'Received great feedback', created_at: '' },
      { id: 6, key: 'idea', emoji: '💡', label: 'Innovator', description: 'Suggested a new feature', created_at: '' },
      { id: 7, key: 'heart', emoji: '❤️', label: 'Heart', description: 'Supported a local café', created_at: '' },
      { id: 8, key: 'cool', emoji: '😎', label: 'Cool Cat', description: 'Logged in 7 days in a row', created_at: '' },
      { id: 9, key: 'rockstar', emoji: '🧑‍🎤', label: 'Rockstar', description: 'Hosted a big meetup', created_at: '' },
      { id: 10, key: 'cat', emoji: '🐱', label: 'Cat Person', description: 'Met up with a cat lover', created_at: '' },
      { id: 11, key: 'dog', emoji: '🐶', label: 'Dog Person', description: 'Met up with a dog lover', created_at: '' },
      { id: 12, key: 'rainbow', emoji: '🌈', label: 'Rainbow', description: 'Joined a pride event', created_at: '' },
    ]);
  }, []);

  useEffect(() => {
    const fetchBadges = async () => {
      const allBadges = await getAllBadges();
      setBadges(allBadges);
    };
    fetchBadges();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2f1] to-[#b2dfdb]">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-primary-700 mb-8">{t('account.title')}</h1>

          {/* Next Meetup Section (at the top) */}
          {nextMeetup && (
            <div className="card mb-6 bg-primary-50 border-l-4 border-primary-400 p-4 flex flex-col sm:flex-row items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-primary-700 mb-1">{t('account.nextMeetup', 'Your next meetup')}</div>
                <div className="text-base text-primary-800">
                  {nextMeetup.selected_date} {nextMeetup.selected_time && `, ${nextMeetup.selected_time}`}
                  {nextMeetup.cafe_id && <span> @ {nextMeetup.cafe_id}</span>}
                </div>
              </div>
              <button className="btn-primary mt-3 sm:mt-0">{t('account.viewMeetup', 'View details')}</button>
            </div>
          )}

          {/* Personal Invite Link Section (always visible if user) */}
          {user && (
            <div className="card mb-6 flex flex-col items-center bg-white/80">
              <div className="text-lg font-semibold text-primary-700 mb-2">{t('account.personalInvite')}</div>
              <button
                className="btn-primary mb-2"
                onClick={handleGenerateFriendInvite}
                disabled={inviteGenerating}
              >
                {inviteGenerating ? t('account.generating', 'Bezig met genereren...') : t('account.generateInvite', 'Genereer uitnodigingslink')}
              </button>
              {friendInviteLink && (
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full justify-center">
                  <input
                    type="text"
                    value={friendInviteLink}
                    readOnly
                    className="border rounded px-2 py-1 w-full max-w-xs text-center bg-gray-50 font-mono"
                    onFocus={e => e.target.select()}
                  />
                  <button
                    className="btn-secondary text-xs px-2 py-1"
                    onClick={() => {navigator.clipboard.writeText(friendInviteLink)}}
                  >{t('account.copyInvite')}</button>
                </div>
              )}
              {inviteError && <div className="text-xs text-red-500 mt-2">{inviteError}</div>}
              <div className="text-xs text-gray-500 mt-2 text-center">{t('account.inviteHint')}</div>
            </div>
          )}

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
                      disabled={emojiLoading}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            {emojiLoading && <div className="text-xs text-primary-600 mt-2">{t('account.saving', 'Saving...')}</div>}
            {emojiError && <div className="text-xs text-red-500 mt-2">{emojiError}</div>}
          </div>

          {/* Emoji Section Label */}
          <div className="w-full text-center text-lg font-semibold mb-2 text-primary-700">{t('account.emoji')}</div>

          {/* Editable Name, Email, Age Section (restyled) */}
          <div className="card mb-8 px-4 py-3 flex flex-col gap-4 bg-white/80 rounded-xl shadow-md">
            <div className="flex flex-row items-center gap-2">
              <span className="text-xl" aria-hidden>📝</span>
              <span className="font-semibold">{t('account.name')}</span>
              <span className="text-xs text-gray-400 italic ml-2">{t('account.nameEditHint')}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              {editingProfile ? (
                <input
                  type="text"
                  className="input-field"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder={t('account.name')}
                />
              ) : (
                <span className="mobile-text text-lg">{name || t('account.notSpecified')}</span>
              )}
            </div>
            <div className="flex flex-row items-center gap-2">
              <span className="text-xl" aria-hidden>✉️</span>
              <span className="font-semibold">{t('account.email')}</span>
              <span className="text-xs text-gray-400 italic ml-2">{t('account.emailEditHint')}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              {editingProfile ? (
                <input
                  type="email"
                  className="input-field"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder={t('account.email')}
                />
              ) : (
                <span className="mobile-text text-lg">{email || t('account.notSpecified')}</span>
              )}
            </div>
            <div className="flex flex-row items-center gap-2">
              <span className="text-xl" aria-hidden>🎂</span>
              <span className="font-semibold">{t('account.age')}</span>
              <span className="text-xs text-gray-400 italic ml-2">{t('account.ageEditHint')}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              {editingProfile ? (
                <input
                  type="number"
                  className="input-field"
                  value={editAge}
                  onChange={e => setEditAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={t('account.age')}
                  min={0}
                  max={120}
                />
              ) : (
                <span className="mobile-text text-lg">{age !== '' ? age : 'immortal'}</span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              {editingProfile ? (
                <>
                  <button className="btn-primary" onClick={handleProfileSave}>{t('account.save')}</button>
                  <button className="btn-secondary" onClick={handleProfileCancel}>{t('account.cancel')}</button>
                </>
              ) : (
                <button className="btn-secondary" onClick={handleProfileEdit}>{t('account.edit')}</button>
              )}
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

          {/* Badges Section (now between password and danger zone) */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('account.yourBadges')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {badges.map(badge => (
                <div
                  key={badge.key}
                  className={`flex flex-col items-center p-4 rounded-xl shadow-md border-2 ${earnedKeys.has(badge.key) ? 'border-primary-400 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'}`}
                >
                  <span className="text-5xl mb-2">{badge.emoji}</span>
                  <span className="text-lg font-bold mb-1">{badge.label}</span>
                  <span className="text-sm text-gray-600 text-center">{badge.description}</span>
                  {!earnedKeys.has(badge.key) && <span className="mt-2 text-xs text-gray-400">{t('account.locked')}</span>}
                </div>
              ))}
            </div>
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

const AccountPageWithBoundary = () => (
  <ErrorBoundary>
    <Account />
  </ErrorBoundary>
);

export default AccountPageWithBoundary;
