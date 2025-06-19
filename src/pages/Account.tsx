import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getProfile } from '../services/profileService';
import { getAllBadges, getUserBadges } from '../services/badgeService';
import { useTranslation } from 'react-i18next';
import FormStatus from '../components/FormStatus';
import Toast from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary';
import { requestBrowserNotificationPermission } from '../utils/browserNotifications';
import type { Badge, UserBadge } from '../types/supabase';
import { displayCafeTag, displayPriceBracket } from '../utils/display';
import BadgeNotification from '../components/BadgeNotification';
import BadgeProgress from '../components/BadgeProgress';
import BadgeShareModal from '../components/BadgeShareModal';
import { User, Settings, Award, Trash2 } from 'lucide-react';

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
  preferences?: {
    tags?: string[];
    price?: string;
    [key: string]: unknown;
  };
  lastSeen?: string;
  preferred_language: string;
}

interface Invitation {
  id: string;
  selected_date: string;
  selected_time: string;
  cafe_id?: string;
  status: string;
  email_b?: string;
}

function isProfile(obj: unknown): obj is Profile {
  return (
    typeof obj === 'object' && obj !== null && 'id' in obj && 'fullName' in obj && 'email' in obj
  );
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

  // Add state for preferred language
  const [preferredLanguage, setPreferredLanguage] = useState<string>('en');

  const EMOJI_OPTIONS = ['😃', '😎', '🧑‍🎤', '🦄', '🐱', '🐶', '☕️', '🌈', '💡', '❤️'];

  // Split emoji options into rows of 4 for better layout
  const EMOJI_ROWS = [];
  for (let i = 0; i < EMOJI_OPTIONS.length; i += 4) {
    EMOJI_ROWS.push(EMOJI_OPTIONS.slice(i, i + 4));
  }

  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);

  // 1. Add state for emoji update loading and error
  const [emojiLoading, setEmojiLoading] = useState(false);
  const [emojiError, setEmojiError] = useState<string | null>(null);

  const CAFE_TAG_OPTIONS = [
    'cozy',
    'laptop_friendly',
    'vegan',
    'outdoor',
    'quiet',
    'trendy',
    'local',
    'breakfast',
    'lunch',
    'specialty_coffee',
    'pastries',
    'dog_friendly',
    'plant_based',
    'wifi',
    'kids',
    'board_games',
    'art',
    'music',
    'book_corner',
    'sustainable',
    'student_discount',
  ];
  const PRICE_BRACKET_OPTIONS = ['low', 'mid', 'high'];

  const [preferences, setPreferences] = useState<{ tags?: string[]; price?: string }>({});

  // Find next upcoming meetup
  const nextMeetup = useMemo(() => {
    if (!myMeetups || myMeetups.length === 0) return null;
    const now = new Date();
    return (
      myMeetups
        .filter((m) => new Date(m.selected_date) >= now)
        .sort(
          (a, b) => new Date(a.selected_date).getTime() - new Date(b.selected_date).getTime(),
        )[0] || null
    );
  }, [myMeetups]);

  // Add state for badge notification and sharing
  const [badgeNotification, setBadgeNotification] = useState<Badge | null>(null);
  const [shareBadge, setShareBadge] = useState<Badge | null>(null);

  // BADGE TABS LOGIC
  const badgeStatusTabs = [
    { key: 'unlocked', label: 'Unlocked' },
    { key: 'inprogress', label: 'In Progress' },
    { key: 'locked', label: 'Locked' },
  ];
  const [activeBadgeTab, setActiveBadgeTab] = useState('unlocked');
  const earnedKeys = new Set(userBadges.map((b) => b.badge_key));
  const unlockedBadges = badges.filter((b) => earnedKeys.has(b.key));
  const inProgressBadges = badges.filter((b) => !earnedKeys.has(b.key) && b.key === 'five_friends'); // Example: only five_friends is progress
  const lockedBadges = badges.filter((b) => !earnedKeys.has(b.key) && b.key !== 'five_friends');

  // Add state for prefs toast
  const [prefsToast, setPrefsToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Fout bij ophalen sessie:', sessionError);
        return;
      }
      if (!session?.user) {
        navigate('/login');
        return;
      }
      // --- NEW: Sync Google profile info to Supabase profiles table ---
      const user = session.user;
      let fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const email = user.email;
      if (!fullName && email) {
        fullName = email.split('@')[0];
      }
      // Upsert profile info (id, fullName, email)
      await supabase.from('profiles').upsert({
        id: user.id,
        fullName,
        email,
      });
      // --- END NEW ---
      // Haal profiel op
      const { data: profileData, error: profileError } = await getProfile(session.user.id);
      if (profileError) {
        console.error('Fout bij ophalen profiel:', profileError);
      }
      if (profileData && isProfile(profileData)) {
        setUser(profileData);
        if (profileData.emoji) setSelectedEmoji(profileData.emoji);
        if (profileData.age !== undefined && profileData.age !== null) setAge(profileData.age);
        setWantsUpdates(!!profileData.wantsUpdates);
        setWantsReminders(profileData.wantsReminders !== false);
        setWantsNotifications(!!profileData.wantsNotifications);
        setIsPrivate(!!profileData.isPrivate);
        setPreferences(profileData.preferences || {});
        setPreferredLanguage(profileData.preferred_language || 'en');
      } else {
        setUser(null);
      }
      setEmail(user.email || '');
      setName(fullName);
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
          getUserBadges(session.user.id),
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
    const { error } = await supabase
      .from('profiles')
      .update({
        wantsUpdates,
        wantsReminders,
        wantsNotifications,
        isPrivate,
        preferences,
      })
      .eq('id', user.id);
    if (error) {
      setPrefsToast({
        message: t('account.errorPrefsUpdate', 'Could not save preferences.'),
        type: 'error',
      });
    } else {
      setPrefsToast({ message: t('account.prefsSaved', 'Preferences saved!'), type: 'success' });
      setShowProfileToast(true);
    }
    setPrefsSaving(false);
  };

  const handleDeleteAccount = async () => {
    const confirmMsg = t('account.deleteConfirm', 'Are you sure? This cannot be undone!');
    if (!window.confirm(confirmMsg)) return;
    
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Failed to get session for deletion', sessionError);
        return;
      }

      // Get a fresh access token
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      if (refreshError || !refreshedSession) {
        console.error('Failed to refresh session', refreshError);
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${refreshedSession.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Delete account failed:', errorText);
        alert(t('account.deleteError', 'Failed to delete account. Please try again.'));
        return;
      }

      const body = await res.json();
      if (!body.success) {
        console.error('Delete account failed:', body);
        alert(t('account.deleteError', 'Failed to delete account. Please try again.'));
        return;
      }

      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('Unexpected delete error:', err);
      alert(t('account.deleteError', 'Failed to delete account. Please try again.'));
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
    // Validate required fields
    if (!editName.trim() || !editEmail.trim()) {
      alert(t('account.errorRequiredFields', 'Name and email are required.'));
      return;
    }
    // Sanitize age
    const sanitizedAge = editAge === '' ? null : Number(editAge);
    // Prepare update object
    const updateObj: Record<string, unknown> = {
      fullName: editName,
      email: editEmail,
      age: sanitizedAge,
      preferred_language: preferredLanguage,
      wantsUpdates,
      wantsReminders,
      wantsNotifications,
      isPrivate,
      preferences,
    };
    const { error } = await supabase.from('profiles').update(updateObj).eq('id', user.id);
    if (!error) {
      setName(editName);
      setAge(sanitizedAge === null ? '' : sanitizedAge);
      setEmail(editEmail);
      setShowProfileToast(true);
      setEditingProfile(false);
    } else {
      if (
        error.code === '23505' ||
        (error.message && error.message.toLowerCase().includes('duplicate'))
      ) {
        alert(t('account.errorDuplicateEmail', 'This email is already in use.'));
      } else {
        alert(t('account.errorProfileUpdate', 'Could not update profile.'));
      }
    }
  };

  const handleTagToggle = async (tag: string) => {
    if (!user) return;
    const tags = preferences.tags || [];
    const newTags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    setPreferences((prev) => ({ ...prev, tags: newTags }));
    await supabase
      .from('profiles')
      .update({ preferences: { ...preferences, tags: newTags } })
      .eq('id', user.id);
  };

  const handlePriceSelect = async (price: string) => {
    if (!user) return;
    setPreferences((prev) => ({ ...prev, price }));
    await supabase
      .from('profiles')
      .update({ preferences: { ...preferences, price } })
      .eq('id', user.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2f1] to-[#b2dfdb]">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-primary-700 mb-8">{t('account.title')}</h1>

          {/* Show logged in message */}
          {user && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center font-semibold">
              {i18n.language === 'nl' ? 'Je bent ingelogd!' : "You're logged in!"}
            </div>
          )}

          {/* Show last seen */}
          {user && user.lastSeen && (
            <div className="mb-4 text-sm text-gray-500 text-center">
              {i18n.language === 'nl'
                ? `Laatst gezien: ${new Date(user.lastSeen).toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })}`
                : `Last seen: ${new Date(user.lastSeen).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`}
            </div>
          )}

          {/* Next Meetup Section (at the top) */}
          {nextMeetup && (
            <div className="card mb-6 bg-primary-50 border-l-4 border-primary-400 p-4 flex flex-col sm:flex-row items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-primary-700 mb-1">
                  {t('account.nextMeetup', 'Your next meetup')}
                </div>
                <div className="text-base text-primary-800">
                  {nextMeetup.selected_date}{' '}
                  {nextMeetup.selected_time && `, ${nextMeetup.selected_time}`}
                  {nextMeetup.cafe_id && <span> @ {nextMeetup.cafe_id}</span>}
                </div>
              </div>
              <button className="btn-primary mt-3 sm:mt-0">
                {t('account.viewMeetup', 'View details')}
              </button>
            </div>
          )}

          {/* Emoji Section */}
          <div className="card mb-6 flex flex-col items-center">
            <div className="text-7xl mb-4">{selectedEmoji || '👤'}</div>
            <div className="flex flex-col gap-2">
              {EMOJI_ROWS.map((row, rowIdx) => (
                <div key={rowIdx} className="flex gap-2 justify-center">
                  {row.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className={`w-12 h-12 text-3xl rounded-full border-2 transition-transform p-0 ${selectedEmoji === emoji ? 'border-primary-600 scale-110 bg-primary-100' : 'border-gray-200 bg-white hover:border-primary-400'}`}
                      disabled={emojiLoading}
                      aria-pressed={selectedEmoji === emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            {emojiLoading && (
              <div className="text-xs text-primary-600 mt-2">
                {t('account.saving', 'Saving...')}
              </div>
            )}
            {emojiError && <div className="text-xs text-red-500 mt-2">{emojiError}</div>}
          </div>

          {/* Emoji Section Label */}
          <div className="w-full text-center text-lg font-semibold mb-2 text-primary-700">
            {t('account.emoji')}
          </div>

          {/* Editable Name, Email, Age Section (restyled) */}
          <div className="card mb-8 px-4 py-3 flex flex-col gap-4 bg-white/80 rounded-xl shadow-md">
            <div className="flex flex-row items-center gap-2">
              <User className="w-5 h-5 text-accent-500 mr-2 inline" />
              <span className="font-semibold">{t('account.name')}</span>
              <span className="text-xs text-gray-400 italic ml-2">{t('account.nameEditHint')}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              {editingProfile ? (
                <input
                  type="text"
                  className="input-field"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t('account.name')}
                />
              ) : (
                <span className="mobile-text text-lg">{name || t('account.notSpecified')}</span>
              )}
            </div>
            <div className="flex flex-row items-center gap-2">
              <Settings className="w-5 h-5 text-accent-500 mr-2 inline" />
              <span className="font-semibold">{t('account.email')}</span>
              <span className="text-xs text-gray-400 italic ml-2">
                {t('account.emailEditHint')}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              {editingProfile ? (
                <input
                  type="email"
                  className="input-field"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder={t('account.email')}
                />
              ) : (
                <span className="mobile-text text-lg">{email || t('account.notSpecified')}</span>
              )}
            </div>
            <div className="flex flex-row items-center gap-2">
              <User className="w-5 h-5 text-accent-500 mr-2 inline" />
              <span className="font-semibold">{t('account.age')}</span>
              <span className="text-xs text-gray-400 italic ml-2">{t('account.ageEditHint')}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              {editingProfile ? (
                <input
                  type="number"
                  className="input-field"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={t('account.age')}
                  min={0}
                  max={120}
                />
              ) : (
                <span className="mobile-text text-lg">{age !== '' ? age : 'immortal'}</span>
              )}
            </div>
            <div className="flex flex-row items-center gap-2 mt-4">
              <span className="font-semibold">
                {t('account.preferredLanguageFun', 'What language do you vibe with?')}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              {editingProfile ? (
                <select
                  className="input-field"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="nl">Nederlands</option>
                </select>
              ) : (
                <span className="mobile-text text-lg">
                  {preferredLanguage === 'nl' ? 'Nederlands' : 'English'}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              {editingProfile ? (
                <>
                  <button className="btn-primary" onClick={handleProfileSave}>
                    {t('account.save')}
                  </button>
                  <button className="btn-secondary" onClick={handleProfileCancel}>
                    {t('account.cancel')}
                  </button>
                </>
              ) : (
                <button className="btn-secondary" onClick={handleProfileEdit}>
                  {t('account.edit')}
                </button>
              )}
            </div>
          </div>
          <hr className="my-2 border-gray-200" />

          {/* Preferences Section */}
          <div className="card mb-8 bg-white/90 rounded-xl shadow p-6 border border-primary-100">
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
                    {t('account.wantsUpdatesCheckbox', 'Surprise me with new stuff')}
                  </label>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="w-full sm:w-32 font-semibold">
                  {t('account.wantsReminders')}
                </label>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={wantsReminders}
                      onChange={(e) => setWantsReminders(e.target.checked)}
                    />
                    {t('account.wantsRemindersCheckbox', 'Nudge me before a meetup')}
                  </label>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="w-full sm:w-32 font-semibold">
                  {t('account.wantsNotifications')}
                </label>
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
                    {t('account.isPrivateCheckbox', 'Hide my profile from others')}
                  </label>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="w-full sm:w-32 font-semibold">
                  {t('account.cafePreferences', 'Café preferences')}
                </label>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="mb-2">
                    <div className="font-medium text-sm mb-1">
                      {t('account.cafeTags', 'Preferred tags')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CAFE_TAG_OPTIONS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className={`px-2 py-1 rounded-full border text-xs font-semibold transition ${preferences.tags?.includes(tag) ? 'bg-primary-200 border-primary-500 text-primary-900' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                          onClick={() => handleTagToggle(tag)}
                          aria-pressed={preferences.tags?.includes(tag)}
                        >
                          {displayCafeTag(tag, t)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-sm mb-1">
                      {t('account.cafePriceBracket', 'Preferred price bracket')}
                    </div>
                    <div className="flex gap-2">
                      {PRICE_BRACKET_OPTIONS.map((bracket) => (
                        <button
                          key={bracket}
                          type="button"
                          className={`px-3 py-1 rounded-full border text-xs font-semibold transition ${preferences.price === bracket ? 'bg-primary-200 border-primary-500 text-primary-900' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                          onClick={() => handlePriceSelect(bracket)}
                          aria-pressed={preferences.price === bracket}
                        >
                          {displayPriceBracket(bracket, t)}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-full border text-xs font-semibold transition ${!preferences.price ? 'bg-primary-100 border-primary-300 text-primary-700' : 'bg-gray-100 border-gray-300 text-gray-400'}`}
                        onClick={() => handlePriceSelect('')}
                        aria-pressed={!preferences.price}
                      >
                        {t('account.noPreference', 'No preference')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handlePrefsSave}
                  disabled={prefsSaving}
                  className="btn-primary active:scale-95 active:bg-primary-100 focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-busy={prefsSaving}
                >
                  {prefsSaving ? t('account.saving') : t('account.save')}
                </button>
                {prefsSaving === false && showProfileToast && (
                  <div className="mt-2 text-green-600 text-sm">{t('toast.profileUpdated')}</div>
                )}
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-primary-700 mb-6">
              <Settings className="w-5 h-5 text-accent-500 mr-2 inline" />
              {t('account.password')}
            </h2>
            {showPwForm ? (
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
                <label className="w-full sm:w-32 font-semibold">
                  {t('account.changePassword')}
                </label>
                <button onClick={() => setShowPwForm(true)} className="btn-secondary">
                  {t('account.changePassword')}
                </button>
              </div>
            )}
          </div>

          {/* Badges Section */}
          <div className="card mb-8 bg-white/90 rounded-xl shadow p-6 border border-primary-100">
            <h2 className="text-2xl font-bold text-primary-700 mb-6">
              <Award className="w-5 h-5 text-accent-500 mr-2 inline" />
              {t('account.yourBadges')}
            </h2>
            <div className="flex gap-4 mb-6">
              {badgeStatusTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`px-4 py-2 rounded-full font-semibold transition-colors text-base flex items-center gap-2 ${activeBadgeTab === tab.key ? 'bg-accent-500 text-white' : 'bg-accent-50 text-accent-500'}`}
                  onClick={() => setActiveBadgeTab(tab.key)}
                >
                  {tab.label}
                  <span className="ml-1 bg-white/30 text-xs px-2 py-0.5 rounded-full font-bold">
                    {tab.key === 'unlocked'
                      ? unlockedBadges.length
                      : tab.key === 'inprogress'
                        ? inProgressBadges.length
                        : lockedBadges.length}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {(activeBadgeTab === 'unlocked'
                ? unlockedBadges
                : activeBadgeTab === 'inprogress'
                  ? inProgressBadges
                  : lockedBadges
              ).map((badge) => {
                const earned = earnedKeys.has(badge.key);
                let progress = null;
                if (badge.key === 'five_friends') {
                  const friendCount =
                    userBadges.filter((b) => b.badge_key === 'add_friend').length + 1; // Example logic
                  progress = (
                    <BadgeProgress
                      badge={badge}
                      currentProgress={friendCount}
                      requiredProgress={5}
                    />
                  );
                }
                return (
                  <div
                    key={badge.key}
                    className={`flex flex-col items-center p-4 rounded-xl shadow-md border-2 transition-all duration-200 ${earned ? 'border-primary-400 bg-white scale-105' : badge.key === 'five_friends' ? 'border-accent-500 bg-accent-50' : 'border-gray-200 bg-gray-50 opacity-60 grayscale'}`}
                  >
                    <span className="text-5xl mb-2">{badge.emoji}</span>
                    <span className="text-lg font-bold mb-1">{badge.label}</span>
                    <span className="text-sm text-gray-600 text-center">{badge.description}</span>
                    {progress}
                    {earned && (
                      <button className="btn-secondary mt-2" onClick={() => setShareBadge(badge)}>
                        Share
                      </button>
                    )}
                    {!earned && badge.key !== 'five_friends' && (
                      <span className="mt-2 text-xs text-gray-400">{t('account.locked')}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {badgeNotification && (
            <BadgeNotification
              badge={badgeNotification}
              onClose={() => setBadgeNotification(null)}
            />
          )}
          {shareBadge && <BadgeShareModal badge={shareBadge} onClose={() => setShareBadge(null)} />}

          {/* Danger Zone */}
          <div className="card border-2 border-red-500">
            <h2 className="text-2xl font-bold text-red-500 mb-6">
              <Trash2 className="w-5 h-5 text-red-500 mr-2 inline" />
              Delete account
            </h2>
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
              message="Got it – settings saved."
              type="success"
              onClose={() => setShowProfileToast(false)}
              duration={3000}
              position="bottom-right"
            />
          )}
          {showPasswordToast && (
            <Toast
              message={t('toast.passwordChanged')}
              type="success"
              onClose={() => setShowPasswordToast(false)}
            />
          )}

          {prefsToast && (
            <Toast
              message={prefsToast.message}
              type={prefsToast.type}
              onClose={() => setPrefsToast(null)}
              position="bottom-right"
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
