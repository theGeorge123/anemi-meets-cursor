import { useEffect, useState, useMemo, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  getProfile,
  getFriends,
  getOutgoingFriendRequests,
  getIncomingFriendRequests,
} from "../services/supabaseService";
import { useTranslation } from "react-i18next";
import LoadingIndicator from "../components/LoadingIndicator";
import SkeletonLoader from "../components/SkeletonLoader";
import OnboardingModal from "../features/dashboard/components/OnboardingModal";
import NavigationBarWithBoundary from '../components/NavigationBar';

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
  const { t } = useTranslation();
  const DASHBOARD_CACHE_KEY = "dashboard_cache_v1";
  const [meetups, setMeetups] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const navigate = useNavigate();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Find next upcoming meetup
  const nextMeetup = useMemo(() => {
    if (!meetups || meetups.length === 0) return null;
    const now = new Date();
    return (
      meetups
        .filter((m) => new Date(m.selected_date) >= now)
        .sort(
          (a, b) =>
            new Date(a.selected_date).getTime() -
            new Date(b.selected_date).getTime(),
        )[0] || null
    );
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
        navigate("/login");
        return;
      }
      // Update lastSeen on dashboard visit
      await supabase
        .from("profiles")
        .update({ lastSeen: new Date().toISOString() })
        .eq("id", session.user.id);
      // Onboarding check: only show for new signups
      if (localStorage.getItem("anemi-show-onboarding")) {
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
      const { data, error } = await supabase
        .from("invitations")
        .select("id, selected_date, selected_time, cafe_id, status, email_b")
        .or(
          `invitee_id.eq.${session.user.id},email_b.eq."${session.user.email}"`,
        );
      if (error) {
        if (cached) {
          try {
            const cache = JSON.parse(cached);
            setProfile(cache.profile || null);
            setFriends(cache.friends || []);
            setOutgoingRequests(cache.outgoingRequests || []);
            setIncomingRequests(cache.incomingRequests || []);
            setMeetups(cache.meetups || []);
            setLoading(false);
            return;
          } catch (err) {
            console.error(err);
          }
        }
        setError(t("dashboard.errorLoadingMeetups"));
      } else {
        setMeetups((data || []) as Invitation[]);
        localStorage.setItem(
          DASHBOARD_CACHE_KEY,
          JSON.stringify({
            profile: profileData,
            friends: friendsList,
            outgoingRequests: outgoing,
            incomingRequests: incoming,
            meetups: data || [],
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
        .channel("invitations")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "invitations" },
          (payload) => {
            const newInvite = payload.new as Invitation;
            if (
              newInvite.invitee_id === session.user.id ||
              newInvite.email_b === session.user.email ||
              newInvite.email_a === session.user.email
            ) {
              setMeetups((prev) => {
                if (prev.some((m) => m.id === newInvite.id)) return prev;
                const updated = [...prev, newInvite];
                localStorage.setItem(
                  DASHBOARD_CACHE_KEY,
                  JSON.stringify({
                    profile,
                    friends,
                    outgoingRequests,
                    incomingRequests,
                    meetups: updated,
                  }),
                );
                return updated;
              });
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "invitations" },
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
  const sortedMeetups = [...meetups].sort((a, b) =>
    a.selected_date.localeCompare(b.selected_date),
  );
  const upcoming = sortedMeetups.filter(
    (m) => new Date(m.selected_date) >= new Date(),
  );
  const lastActivity =
    sortedMeetups.length > 0 ? sortedMeetups[sortedMeetups.length - 1] : null;

  return (
    <>
      <NavigationBarWithBoundary profileEmoji={profile?.emoji} />
      <div className="max-w-2xl mx-auto py-8 px-4">
        {showOnboarding && (
          <OnboardingModal
            onFinish={() => {
              setShowOnboarding(false);
              localStorage.removeItem("anemi-show-onboarding");
              localStorage.setItem("anemi-onboarded", "1");
            }}
          />
        )}
        {/* Welcome message at the top */}
        <div className="flex items-center gap-3 mb-6">
          {profile?.emoji && (
            <span className="text-4xl" title={profile.fullName}>
              {profile.emoji}
            </span>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-700 mb-1">
              {t("dashboard.welcome")}, {profile?.fullName || t("dashboard.user")}!
            </h1>
            {profile && (
              <div className="text-gray-600 text-sm">
                {t("dashboard.lastLogin", {
                  date: profile.lastSeen
                    ? new Date(profile.lastSeen).toLocaleDateString()
                    : "",
                })}
              </div>
            )}
          </div>
        </div>
        {/* Next Meetup Section (just below welcome) */}
        {nextMeetup && (
          <div className="card mb-6 bg-primary-50 border-l-4 border-primary-400 p-4 flex flex-col sm:flex-row items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-primary-700 mb-1">
                {t("dashboard.nextMeetup", "Your next meetup")}
              </div>
              <div className="text-base text-primary-800">
                {nextMeetup.selected_date}{" "}
                {nextMeetup.selected_time && `, ${nextMeetup.selected_time}`}
                {nextMeetup.cafe_name && <span> @ {nextMeetup.cafe_name}</span>}
              </div>
            </div>
            <button className="btn-primary mt-3 sm:mt-0">
              {t("dashboard.viewMeetup", "View details")}
            </button>
          </div>
        )}

        {/* Welkomstbericht */}
        {lastActivity && (
          <div className="mb-6">
            <div className="text-gray-700 text-base">
              {t("dashboard.lastActivity")}:{" "}
              <span className="font-semibold">
                {lastActivity.selected_date}
                {lastActivity.selected_time && `, ${lastActivity.selected_time}`}
              </span>
              {lastActivity.cafe_name && <span> @ {lastActivity.cafe_name}</span>}
            </div>
          </div>
        )}

        {/* Samenvatting aankomende meetups */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-primary-700 mb-2">
            {t("dashboard.upcomingMeetups")}
          </h2>
          {loading && (
            <>
              <LoadingIndicator
                label={t("common.loading")}
                size="md"
                className="my-4"
              />
              <SkeletonLoader
                count={2}
                height="h-16"
                className="my-2"
                ariaLabel={t("common.loading")}
              />
            </>
          )}
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {!loading && !error && upcoming.length === 0 && (
            <div className="text-gray-600 text-center">
              {t("dashboard.noMeetups")}
            </div>
          )}
          {!loading && !error && upcoming.length > 0 && (
            <ul className="space-y-4">
              {upcoming.slice(0, 3).map((m) => (
                <li
                  key={m.id}
                  className="bg-white/80 rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border border-primary-100"
                >
                  <div>
                    <span className="font-semibold text-primary-700">
                      {m.selected_date}
                    </span>
                    {m.selected_time && <span> &bull; {m.selected_time}</span>}
                    {m.cafe_name && <span> &bull; {m.cafe_name}</span>}
                    {!m.cafe_name && m.cafe_id && (
                      <span>
                        {" "}
                        &bull; {t("cafe")} {m.cafe_id}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 sm:mt-0 px-3 py-1 rounded-full font-semibold ${m.status === "confirmed" ? "bg-green-100 text-green-700" : m.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-200 text-gray-700"}`}
                  >
                    {t(`account.status.${m.status}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Call-to-action knoppen */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            className="btn-primary flex-1 text-center active:scale-95 active:bg-primary-100"
            onClick={() => navigate("/create-meetup")}
            aria-label={t("dashboard.ctaNewMeetup")}
          >
            {t("dashboard.ctaNewMeetup")}
          </button>
          <button
            className="btn-secondary flex-1 text-center active:scale-95 active:bg-primary-100"
            onClick={() => navigate("/account")}
            aria-label={t("dashboard.ctaProfile")}
          >
            {t("dashboard.ctaProfile")}
          </button>
          <button
            className="btn-secondary flex-1 text-center active:scale-95 active:bg-primary-100"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}
            aria-label={t("dashboard.ctaLogout")}
          >
            {t("dashboard.ctaLogout")}
          </button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
