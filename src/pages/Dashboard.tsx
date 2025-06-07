import { useEffect, useState, useMemo, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getProfile } from '../services/supabaseService';
import { useTranslation } from 'react-i18next';
import LoadingIndicator from '../components/LoadingIndicator';
import SkeletonLoader from '../components/SkeletonLoader';
import OnboardingModal from '../features/dashboard/components/OnboardingModal';

interface Invitation {
  id: string;
  selected_date: string;
  selected_time: string;
  cafe_id?: string;
  cafe_name?: string;
  status: string;
  email_b?: string;
  invitee_id?: string;
  email_a?: string;
}

interface Profile {
  id: string;
  fullName: string;
  emoji?: string;
  lastSeen?: string;
  email?: string;
}

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const DASHBOARD_CACHE_KEY = 'dashboard_cache_v1';
  const [meetups, setMeetups] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingFriends, setPendingFriends] = useState<Profile[]>([]);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [addFriendValue, setAddFriendValue] = useState('');
  const [addFriendStatus, setAddFriendStatus] = useState<string | null>(null);
  const [friendSearch, setFriendSearch] = useState('');
  const navigate = useNavigate();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const cached = localStorage.getItem(DASHBOARD_CACHE_KEY);
      if (!navigator.onLine && cached) {
        try {
          const cache = JSON.parse(cached);
          setProfile(cache.profile || null);
          setFriends(cache.friends || []);
          setPendingFriends(cache.pendingFriends || []);
          setMeetups(cache.meetups || []);
          setLoading(false);
          return;
        } catch (err) {
          console.error(err);
        }
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }
      // Update lastSeen on dashboard visit
      await supabase
        .from('profiles')
        .update({ lastSeen: new Date().toISOString() })
        .eq('id', session.user.id);
      // Onboarding check: only show for new signups
      if (localStorage.getItem('anemi-show-onboarding')) {
        setShowOnboarding(true);
      }
      // Profiel ophalen (inclusief lastSeen)
      const { data: profileData } = await getProfile(session.user.id);
      setProfile(profileData as Profile);
      // Friends ophalen (accepted)
      const { data: friendshipRows } = await supabase
        .from('friendships')
        .select('friend_id, status')
        .eq('user_id', session.user.id);
      let friendsList: Profile[] = [];
      let pendingList: Profile[] = [];
      if (friendshipRows && friendshipRows.length > 0) {
        const acceptedIds = friendshipRows.filter((f: { friend_id: string, status: string }) => f.status === 'accepted').map((f: { friend_id: string }) => f.friend_id);
        const pendingIds = friendshipRows.filter((f: { friend_id: string, status: string }) => f.status === 'pending').map((f: { friend_id: string }) => f.friend_id);
        if (acceptedIds.length > 0) {
          const { data: friendProfiles } = await supabase
            .from('profiles')
            .select('id, fullName, emoji, email')
            .in('id', acceptedIds);
          friendsList = friendProfiles || [];
        }
        if (pendingIds.length > 0) {
          const { data: pendingProfiles } = await supabase
            .from('profiles')
            .select('id, fullName, emoji, email')
            .in('id', pendingIds);
          pendingList = pendingProfiles || [];
        }
      }
      setFriends(friendsList);
      setPendingFriends(pendingList);
      // Meetups ophalen
      const { data, error } = await supabase
        .from('invitations')
        .select('id, selected_date, selected_time, cafe_id, cafe_name, status, email_b')
        .or(`invitee_id.eq.${session.user.id},email_b.eq."${session.user.email}",email_a.eq."${session.user.email}"`);
      if (error) {
        if (cached) {
          try {
            const cache = JSON.parse(cached);
            setProfile(cache.profile || null);
            setFriends(cache.friends || []);
            setPendingFriends(cache.pendingFriends || []);
            setMeetups(cache.meetups || []);
            setLoading(false);
            return;
          } catch (err) {
            console.error(err);
          }
        }
        setError(t('dashboard.errorLoadingMeetups'));
      } else {
        setMeetups((data || []) as Invitation[]);
        localStorage.setItem(
          DASHBOARD_CACHE_KEY,
          JSON.stringify({
            profile: profileData,
            friends: friendsList,
            pendingFriends: pendingList,
            meetups: data || []
          })
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [navigate, t]);

  useEffect(() => {
    const subscribe = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      channelRef.current = supabase.channel('invitations')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invitations' }, payload => {
          const newInvite = payload.new as Invitation;
          if (newInvite.invitee_id === session.user.id || newInvite.email_b === session.user.email || newInvite.email_a === session.user.email) {
            setMeetups(prev => {
              if (prev.some(m => m.id === newInvite.id)) return prev;
              const updated = [...prev, newInvite];
              localStorage.setItem(
                DASHBOARD_CACHE_KEY,
                JSON.stringify({
                  profile,
                  friends,
                  pendingFriends,
                  meetups: updated
                })
              );
              return updated;
            });
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'invitations' }, payload => {
          const updatedInvite = payload.new as Invitation;
          if (updatedInvite.invitee_id === session.user.id || updatedInvite.email_b === session.user.email || updatedInvite.email_a === session.user.email) {
            setMeetups(prev => {
              const updatedList = prev.map(m => m.id === updatedInvite.id ? { ...m, ...updatedInvite } : m);
              localStorage.setItem(
                DASHBOARD_CACHE_KEY,
                JSON.stringify({
                  profile,
                  friends,
                  pendingFriends,
                  meetups: updatedList
                })
              );
              return updatedList;
            });
          }
        });

      channelRef.current.subscribe();
    };

    subscribe();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile, friends, pendingFriends]);

  // Sorteer meetups op datum (oplopend)
  const sortedMeetups = [...meetups].sort((a, b) => a.selected_date.localeCompare(b.selected_date));
  const upcoming = sortedMeetups.filter(m => new Date(m.selected_date) >= new Date());
  const lastActivity = sortedMeetups.length > 0 ? sortedMeetups[sortedMeetups.length - 1] : null;

  const filteredFriends = useMemo(() =>
    friends.filter(f =>
      f.fullName.toLowerCase().includes(friendSearch.toLowerCase()) ||
      (f.email ? f.email.toLowerCase().includes(friendSearch.toLowerCase()) : false)
    ),
  [friends, friendSearch]);

  // Remove friend handler
  const handleRemoveFriend = async (friendId: string) => {
    await supabase.from('friendships').delete().eq('user_id', profile?.id).eq('friend_id', friendId);
    setFriends(friends.filter(f => f.id !== friendId));
  };

  // Generate invite code handler
  const handleGenerateInvite = async () => {
    setInviteLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    let token = crypto.randomUUID().replace(/-/g, '');
    // Ensure the token is unique
    let { data: existing } = await supabase
      .from('friend_invites')
      .select('id')
      .eq('token', token)
      .maybeSingle();
    while (existing) {
      token = crypto.randomUUID().replace(/-/g, '');
      ({ data: existing } = await supabase
        .from('friend_invites')
        .select('id')
        .eq('token', token)
        .maybeSingle());
    }

    const { error } = await supabase.from('friend_invites').insert({
      inviter_id: session.user.id,
      invitee_email: '', // Will be filled when accepted
      token
    });

    if (!error) {
      setInviteCode(token);
    }
    setInviteLoading(false);
  };

  // Copy invite link handler
  const handleCopyInvite = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(`${window.location.origin}/invite-friend/${inviteCode}`);
    }
  };

  // Add friend by code or email
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFriendStatus(null);
    const value = addFriendValue.trim();
    if (!value) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setAddFriendStatus(t('inviteFriend.loginFirst', 'Please log in.'));
      return;
    }
    // If value looks like a code (token)
    if (/^[a-z0-9]+$/i.test(value) && value.length > 8) {
      // Accept invite by code
      const { data: invite, error: inviteError } = await supabase
        .from('friend_invites')
        .select('id, inviter_id, accepted')
        .eq('token', value)
        .maybeSingle();
      if (inviteError || !invite) {
        setAddFriendStatus(t('inviteFriend.invalid', 'Invalid or expired invite code.'));
        return;
      }
      if (invite.accepted) {
        setAddFriendStatus(t('inviteFriend.alreadyAccepted', 'This invite has already been used.'));
        return;
      }
      // Create friendship (pending for inviter, accepted for invitee)
      const { error: friendshipError } = await supabase.from('friendships').insert([
        { user_id: invite.inviter_id, friend_id: session.user.id, status: 'pending' },
        { user_id: session.user.id, friend_id: invite.inviter_id, status: 'accepted' }
      ]);
      if (friendshipError) {
        setAddFriendStatus(t('inviteFriend.error', 'Could not add friend. Maybe you are already friends?'));
        return;
      }
      await supabase.from('friend_invites').update({ accepted: true, accepted_at: new Date().toISOString(), invitee_email: session.user.email }).eq('token', value);
      setAddFriendStatus(t('inviteFriend.success', 'You are now friends!'));
      setAddFriendValue('');
      return;
    }
    // Otherwise, treat as email
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setAddFriendStatus(t('inviteFriend.invalidEmail', 'Please enter a valid email address or invite code.'));
      return;
    }
    // Find user by email (case-insensitive)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', value)
      .maybeSingle();
    if (!userProfile) {
      setAddFriendStatus(t('inviteFriend.notFound', 'No user found with that email.'));
      return;
    }
    // Check if already friends
    const { data: existing } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('friend_id', userProfile.id)
      .maybeSingle();
    if (existing) {
      setAddFriendStatus(t('inviteFriend.alreadyFriends', 'You are already friends or have a pending request.'));
      return;
    }
    // Create pending friendship
    const { error: addError } = await supabase.from('friendships').insert({
      user_id: session.user.id,
      friend_id: userProfile.id,
      status: 'pending'
    });
    if (addError) {
      setAddFriendStatus(t('inviteFriend.error', 'Could not add friend.'));
      return;
    }
    setAddFriendStatus(t('inviteFriend.requestSent', 'Friend request sent!'));
    setAddFriendValue('');
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {showOnboarding && (
        <OnboardingModal onFinish={() => {
          setShowOnboarding(false);
          localStorage.removeItem('anemi-show-onboarding');
          localStorage.setItem('anemi-onboarded', '1');
        }} />
      )}
      {/* Welkomstbericht */}
      <div className="flex items-center gap-3 mb-6">
        {profile?.emoji && <span className="text-4xl" title={profile.fullName}>{profile.emoji}</span>}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-700 mb-1">
            {t('dashboard.welcome')}, {profile?.fullName || t('dashboard.user')}!
          </h1>
          {profile && (
            <div className="text-gray-600 text-sm">
              {t('dashboard.lastLogin', { date: profile.lastSeen ? new Date(profile.lastSeen).toLocaleDateString() : '' })}
            </div>
          )}
        </div>
      </div>

      {/* Laatste activiteit */}
      {lastActivity && (
        <div className="mb-6">
          <div className="text-gray-700 text-base">
            {t('dashboard.lastActivity')}: <span className="font-semibold">{lastActivity.selected_date}{lastActivity.selected_time && `, ${lastActivity.selected_time}`}</span>
            {lastActivity.cafe_name && <span> @ {lastActivity.cafe_name}</span>}
          </div>
        </div>
      )}

      {/* Friends List */}
      {friends.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-primary-700 mb-2">{t('dashboard.friends', 'Your friends')}</h2>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full mb-3"
            placeholder={t('dashboard.searchFriends')}
            value={friendSearch}
            onChange={e => setFriendSearch(e.target.value)}
          />
          <ul className="flex flex-wrap gap-3">
            {filteredFriends.map(friend => (
              <li key={friend.id} className="flex items-center gap-2 bg-white/80 rounded-xl shadow px-4 py-2 border border-primary-100">
                {friend.emoji && <span className="text-2xl" title={friend.fullName}>{friend.emoji}</span>}
                <span className="font-semibold text-primary-700">{friend.fullName}</span>
                {friend.email ? (
                  <span className="ml-2 text-green-600 text-xs font-semibold">{t('dashboard.hasAccount', 'Has account')}</span>
                ) : (
                  <span className="ml-2 text-gray-400 text-xs">{t('dashboard.noAccount', 'No account')}</span>
                )}
                {friend.email && (
                  <button
                    className="ml-2 btn-secondary text-xs px-2 py-1"
                    onClick={() => navigate(`/create-meetup?invite=${friend.id}`)}
                  >
                    {t('dashboard.inviteToMeetup', 'Invite to meetup')}
                  </button>
                )}
                <button className="ml-2 text-red-500 hover:underline text-xs" onClick={() => handleRemoveFriend(friend.id)}>{t('dashboard.removeFriend', 'Remove')}</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pending Friends List */}
      {pendingFriends.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-primary-700 mb-2">{t('dashboard.pendingFriends', 'Pending friend requests')}</h2>
          <ul className="flex flex-wrap gap-3">
            {pendingFriends.map(friend => (
              <li key={friend.id} className="flex items-center gap-2 bg-yellow-50 rounded-xl shadow px-4 py-2 border border-yellow-200">
                {friend.emoji && <span className="text-2xl" title={friend.fullName}>{friend.emoji}</span>}
                <span className="font-semibold text-yellow-700">{friend.fullName}</span>
                <span className="ml-2 text-xs text-yellow-600">{t('dashboard.pending', 'Pending')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invite Friend Section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-primary-700 mb-2">{t('dashboard.inviteFriend', 'Invite a friend')}</h2>
        <button className="btn-primary" onClick={handleGenerateInvite} disabled={inviteLoading}>{inviteLoading ? t('loading') : t('dashboard.generateInvite', 'Generate invite link')}</button>
        {inviteCode && (
          <div className="mt-2 flex items-center gap-2">
            <input type="text" value={`${window.location.origin}/invite-friend/${inviteCode}`} readOnly className="border rounded px-2 py-1 w-full max-w-xs" />
            <button className="btn-secondary" onClick={handleCopyInvite}>{t('dashboard.copy', 'Copy')}</button>
          </div>
        )}
      </div>

      {/* Add Friend by Code or Email */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-primary-700 mb-2">{t('dashboard.addFriend', 'Add a friend by code or email')}</h2>
        <form className="flex flex-col sm:flex-row gap-2 items-center" onSubmit={handleAddFriend}>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full max-w-xs"
            placeholder={t('dashboard.addFriendPlaceholder', 'Enter invite code or email')}
            value={addFriendValue}
            onChange={e => setAddFriendValue(e.target.value)}
          />
          <button className="btn-primary" type="submit">{t('dashboard.addFriendBtn', 'Add friend')}</button>
        </form>
        {addFriendStatus && <div className="mt-2 text-sm text-primary-700">{addFriendStatus}</div>}
      </div>

      {/* Samenvatting aankomende meetups */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-primary-700 mb-2">{t('dashboard.upcomingMeetups')}</h2>
        {loading && (
          <>
            <LoadingIndicator label={i18n.language === 'nl' ? 'Laden...' : 'Loading...'} size="md" className="my-4" />
            <SkeletonLoader count={2} height="h-16" className="my-2" ariaLabel={i18n.language === 'nl' ? 'Laden...' : 'Loading...'} />
          </>
        )}
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {!loading && !error && upcoming.length === 0 && (
          <div className="text-gray-600 text-center">{t('dashboard.noMeetups')}</div>
        )}
        {!loading && !error && upcoming.length > 0 && (
          <ul className="space-y-4">
            {upcoming.slice(0, 3).map(m => (
              <li key={m.id} className="bg-white/80 rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-primary-100">
                <div>
                  <span className="font-semibold text-primary-700">{m.selected_date}</span>
                  {m.selected_time && <span> &bull; {m.selected_time}</span>}
                  {m.cafe_name && <span> &bull; {m.cafe_name}</span>}
                  {!m.cafe_name && m.cafe_id && <span> &bull; {t('cafe')} {m.cafe_id}</span>}
                </div>
                <span className={`text-xs mt-2 sm:mt-0 px-3 py-1 rounded-full font-semibold ${m.status === 'confirmed' ? 'bg-green-100 text-green-700' : m.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'}`}>{t(`account.status.${m.status}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Call-to-action knoppen */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          className="btn-primary flex-1 text-center active:scale-95 active:bg-primary-100"
          onClick={() => navigate('/create-meetup')}
          aria-label={t('dashboard.ctaNewMeetup')}
        >
          {t('dashboard.ctaNewMeetup')}
        </button>
        <button
          className="btn-secondary flex-1 text-center active:scale-95 active:bg-primary-100"
          onClick={() => navigate('/account')}
          aria-label={t('dashboard.ctaProfile')}
        >
          {t('dashboard.ctaProfile')}
        </button>
        <button
          className="btn-secondary flex-1 text-center active:scale-95 active:bg-primary-100"
          onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
          aria-label={t('dashboard.ctaLogout')}
        >
          {t('dashboard.ctaLogout')}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
