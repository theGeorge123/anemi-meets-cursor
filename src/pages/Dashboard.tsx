import { useEffect, useState, useMemo, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getProfile } from '../services/profileService';
import { getFriends } from '../services/friendshipService';
import {
  getOutgoingFriendRequests,
  getIncomingFriendRequests,
} from '../services/friendRequestService';
import { useTranslation } from 'react-i18next';
import LoadingIndicator from '../components/LoadingIndicator';
import SkeletonLoader from '../components/SkeletonLoader';
import OnboardingModal from '../features/dashboard/components/OnboardingModal';
import NavigationBarWithBoundary from '../components/NavigationBar';
import type { Tables, Database } from '../types/supabase';
import { formatDutchDate } from '../utils/date';
import { CalendarPlus, Coffee, UserCircle } from 'lucide-react';

interface Invitation {
  id: number;
  selected_date: string;
  selected_time: string;
  cafe_id: number;
  status: string;
  email_b: string;
}

// Helper to normalize selected_time to undefined if null
function normalizeMeetups(data: Invitation[]): Invitation[] {
  return data.map((m) => ({
    id: m.id,
    selected_date: m.selected_date,
    selected_time: safeTime(m.selected_time),
    cafe_id: safeTime(m.cafe_id),
    cafe_name: safeTime(m.cafe_name),
    status: safeTime(m.status) ?? 'unknown',
    email_b: safeTime(m.email_b),
    invitee_id: safeTime(m.invitee_id),
    email_a: safeTime(m.email_a),
  }));
}

type Profile = Tables<'profiles'>;
type Meetup = Tables<'meetups'> & { meetups_participants: Participants[] };
type Participants = Tables<'meetups_participants'> & { profiles: Profile };
type SoloAdventureWithCafe = Tables<'solo_adventures'> & { cafes: Tables<'cafes'> };

// Helper to safely display selected_time
function safeTime(val: string | null | undefined): string | undefined {
  return typeof val === 'string' ? val : undefined;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const DASHBOARD_CACHE_KEY = 'dashboard_cache_v1';
  const [meetups, setMeetups] = useState<Meetup[]>([]);
  const [soloAdventures, setSoloAdventures] = useState<SoloAdventureWithCafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<
    Database['public']['Tables']['friend_requests']['Row'][]
  >([]);
  const [incomingRequests, setIncomingRequests] = useState<
    Database['public']['Tables']['friend_requests']['Row'][]
  >([]);
  const navigate = useNavigate();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Find next upcoming meetup
  const nextMeetup = useMemo(() => {
    if (!meetups || meetups.length === 0) return null;
    const now = new Date();
    const result =
      meetups
        .filter((m) => new Date(m.selected_date) >= now)
        .sort(
          (a, b) => new Date(a.selected_date).getTime() - new Date(b.selected_date).getTime(),
        )[0] || null;
    // Normalize selected_time
    return result ? { ...result, selected_time: safeTime(result.selected_time) } : null;
  }, [meetups]);

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
          setOutgoingRequests(cache.outgoingRequests || []);
          setIncomingRequests(cache.incomingRequests || []);
          setMeetups(cache.meetups || []);
          setSoloAdventures(cache.soloAdventures || []);
          setLoading(false);
          return;
        } catch (err) {
          console.error(err);
        }
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }
      // Update lastSeen on dashboard visit
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', session.user.id);
      // Onboarding check: only show for new signups
      if (localStorage.getItem('anemi-show-onboarding')) {
        setShowOnboarding(true);
      }
      // Profiel ophalen (inclusief lastSeen)
      const { data: profileData } = await getProfile(session.user.id);
      setProfile(profileData as Profile);
      // Friends ophalen (accepted)
      const friendsList = await getFriends(session.user.id);
      setFriends(friendsList);
      // Outgoing requests ophalen
      const outgoing = await getOutgoingFriendRequests(session.user.id);
      setOutgoingRequests(outgoing);
      // Incoming requests ophalen
      const incoming = await getIncomingFriendRequests(session.user.id);
      setIncomingRequests(incoming);
      // Meetups ophalen
      const { data: meetupData, error: meetupError } = await supabase
        .from('meetups')
        .select('id, selected_date, selected_time, cafe_id, status, cafes(*)')
        .or(`invitee_id.eq.${session.user.id},cafes.name.eq."${session.user.email}"`);
      if (meetupError) {
        if (cached) {
          try {
            const cache = JSON.parse(cached);
            setProfile(cache.profile || null);
            setFriends(cache.friends || []);
            setOutgoingRequests(cache.outgoingRequests || []);
            setIncomingRequests(cache.incomingRequests || []);
            setMeetups(cache.meetups || []);
            setSoloAdventures(cache.soloAdventures || []);
            setLoading(false);
            return;
          } catch (err) {
            console.error(err);
          }
        }
        setError(t('dashboard.errorLoadingMeetups'));
      } else {
        const normalizedMeetups = normalizeMeetups(meetupData || []) as Meetup[];
        setMeetups(normalizedMeetups);
        localStorage.setItem(
          DASHBOARD_CACHE_KEY,
          JSON.stringify({
            profile: profileData,
            friends: friendsList,
            outgoingRequests: outgoing,
            incomingRequests: incoming,
            meetups: normalizedMeetups,
            soloAdventures: [],
          }),
        );
      }
      setLoading(false);
    };
    fetchData();
  }, [navigate, t]);

  useEffect(() => {
    const subscribe = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      channelRef.current = supabase
        .channel('invitations')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'invitations' },
          (payload) => {
            const newInvite = payload.new as Invitation;
            if (
              newInvite.invitee_id === session.user.id ||
              newInvite.email_b === session.user.email ||
              newInvite.email_a === session.user.email
            ) {
              setMeetups((prev) => {
                if (prev.some((m) => m.id === newInvite.id)) return prev;
                const updated = [...prev, newInvite as Meetup];
                localStorage.setItem(
                  DASHBOARD_CACHE_KEY,
                  JSON.stringify({
                    profile,
                    friends,
                    outgoingRequests,
                    incomingRequests,
                    meetups: updated,
                    soloAdventures: [],
                  }),
                );
                return updated;
              });
            }
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'invitations' },
          (payload) => {
            const updatedInvite = payload.new as Invitation;
            if (
              updatedInvite.invitee_id === session.user.id ||
              updatedInvite.email_b === session.user.email ||
              updatedInvite.email_a === session.user.email
            ) {
              setMeetups((prev) => {
                const updatedList = prev.map((m) =>
                  m.id === updatedInvite.id ? { ...m, ...updatedInvite } : m,
                );
                localStorage.setItem(
                  DASHBOARD_CACHE_KEY,
                  JSON.stringify({
                    profile,
                    friends,
                    outgoingRequests,
                    incomingRequests,
                    meetups: updatedList,
                    soloAdventures: [],
                  }),
                );
                return updatedList;
              });
            }
          },
        );

      channelRef.current.subscribe();
    };

    subscribe();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile, friends, outgoingRequests, incomingRequests]);

  // Sorteer meetups op datum (oplopend)
  const sortedMeetups = [...meetups].sort((a, b) => a.selected_date.localeCompare(b.selected_date));
  const upcoming = sortedMeetups.filter((m) => new Date(m.selected_date) >= new Date());
  const lastActivity =
    sortedMeetups.length > 0
      ? ({
          ...sortedMeetups[sortedMeetups.length - 1],
          selected_time: safeTime(sortedMeetups[sortedMeetups.length - 1].selected_time),
        } as Invitation)
      : null;

  const fetchSoloAdventures = async (userId: string) => {
    const { data, error } = await supabase
      .from('solo_adventures')
      .select('*, cafes(*)')
      .eq('user_id', userId)
      .gte('adventure_date', new Date().toISOString())
      .order('adventure_date', { ascending: true });

    if (error) {
      setError(t('dashboard.errorLoadingMeetups')); // Reusing translation for now
    } else {
      setSoloAdventures(data as any); // Casting to any to avoid type errors
    }
  };

  return (
    <>
      <NavigationBarWithBoundary profileEmoji={safeTime(profile?.emoji)} />
      <div className="max-w-2xl mx-auto py-8 px-4">
        {showOnboarding && (
          <OnboardingModal
            onFinish={() => {
              setShowOnboarding(false);
              localStorage.removeItem('anemi-show-onboarding');
              localStorage.setItem('anemi-onboarded', '1');
            }}
          />
        )}
        {/* Welcome message at the top */}
        <div className="card bg-primary-50 p-4 sm:p-6 rounded-xl shadow-md mb-6">
          {profile && (
            <div className="flex flex-col items-center gap-2 mb-2">
              <span className="text-6xl" role="img" aria-label="profile emoji">
                {profile?.emoji || '☕️'}
              </span>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800">
                  {t('dashboard.welcome', 'Hey there')},{' '}
                  {profile?.fullname || t('dashboard.user', 'friend')}
                </p>
                {profile?.last_seen && (
                  <p className="text-sm text-gray-500">
                    {t('dashboard.lastLogin', 'Last seen: {{date}}', {
                      date: formatDutchDate(profile.last_seen),
                    })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Next Meetup Section (just below welcome) */}
        {nextMeetup && (
          <div className="card mb-6 bg-primary-50 border-l-4 border-primary-400 p-4 flex flex-col sm:flex-row items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-primary-700 mb-1">
                {t('dashboard.nextMeetup', 'Your next meetup')}
              </div>
              <div className="text-base text-primary-800">
                {formatDutchDate(nextMeetup.selected_date)}{' '}
                {safeTime(nextMeetup.selected_time)
                  ? `, ${safeTime(nextMeetup.selected_time)}`
                  : ''}
                {safeTime(nextMeetup.cafe_name) && <span> @ {safeTime(nextMeetup.cafe_name)}</span>}
              </div>
            </div>
            <button className="btn-primary mt-3 sm:mt-0">
              {t('dashboard.viewMeetup', 'View details')}
            </button>
          </div>
        )}

        {/* Welkomstbericht */}
        {lastActivity && (
          <div className="mb-6">
            <div className="text-gray-700 text-base">
              {t('dashboard.lastActivity')}:{' '}
              <span className="font-semibold">
                {lastActivity.selected_date}
                {safeTime(lastActivity.selected_time)
                  ? `, ${safeTime(lastActivity.selected_time)}`
                  : ''}
              </span>
              {safeTime(lastActivity.cafe_name) && (
                <span> @ {safeTime(lastActivity.cafe_name)}</span>
              )}
            </div>
          </div>
        )}

        {/* Samenvatting aankomende meetups */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-primary-700 mb-2">
            {t('dashboard.upcomingMeetups')}
          </h2>
          {loading && (
            <>
              <LoadingIndicator label={t('common.loading')} size="md" className="my-4" />
              <SkeletonLoader
                count={2}
                height="h-16"
                className="my-2"
                ariaLabel={t('common.loading')}
              />
            </>
          )}
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {!loading && !error && upcoming.length === 0 && (
            <div className="text-gray-600 text-center">{t('dashboard.noMeetups')}</div>
          )}
          {!loading && !error && upcoming.length > 0 && (
            <ul className="space-y-4">
              {upcoming.slice(0, 3).map((m) => {
                const time = safeTime(m.selected_time);
                return (
                  <li
                    key={m.id}
                    className="bg-white/80 rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-primary-100"
                  >
                    <div>
                      <span className="font-semibold text-primary-700">
                        {formatDutchDate(m.selected_date)}
                      </span>
                      {time && <span> &bull; {time}</span>}
                      {safeTime(m.cafe_name) && <span> &bull; {m.cafe_name}</span>}
                      {!m.cafe_name && m.cafe_id && (
                        <span>
                          {' '}
                          &bull; {t('cafe')} {m.cafe_id}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 sm:mt-0 px-3 py-1 rounded-full font-semibold ${m.status === 'confirmed' ? 'bg-green-100 text-green-700' : m.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-700'}`}
                    >
                      {t(`account.status.${m.status}`)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Actions Grid */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 my-8 text-center">
          <Link to="/create-meetup" className="btn-primary w-full sm:w-auto">
            <CalendarPlus size={20} className="inline-block mr-2" />
            {t('dashboard.ctaNewMeetup')}
          </Link>
          <Link to="/account" className="btn-secondary w-full sm:w-auto">
            <UserCircle size={20} className="inline-block mr-2" />
            {t('dashboard.ctaProfile')}
          </Link>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4">{t('dashboard.upcomingMeetups')}</h2>
            {loading ? (
              <LoadingIndicator />
            ) : meetups.length === 0 ? (
              <p className="text-gray-500 italic">{t('dashboard.noMeetups')}</p>
            ) : (
              <div className="space-y-4">
                {meetups.map((meetup) => (
                  <MeetupCard key={meetup.id} meetup={meetup} currentUserId={profile?.id} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
