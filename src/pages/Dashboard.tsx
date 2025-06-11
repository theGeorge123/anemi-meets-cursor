import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  getProfile,
  getFriends,
  getOutgoingFriendRequests,
  getIncomingFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../services/supabaseService";
import { useTranslation } from "react-i18next";
import LoadingIndicator from "../components/LoadingIndicator";
import SkeletonLoader from "../components/SkeletonLoader";
import OnboardingModal from "../features/dashboard/components/OnboardingModal";

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
  const [friendSearch, setFriendSearch] = useState("");
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Tab state
  const [activeTab, setActiveTab] = useState<"friends" | "outgoing" | "incoming">("friends");

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

  const filteredFriends = useMemo(
    () =>
      friends.filter(
        (f) =>
          f.fullName.toLowerCase().includes(friendSearch.toLowerCase()) ||
          (f.email
            ? f.email.toLowerCase().includes(friendSearch.toLowerCase())
            : false),
      ),
    [friends, friendSearch],
  );

  // Remove friend handler
  const handleRemoveFriend = async (friendId: string) => {
    await supabase
      .from("friendships")
      .delete()
      .eq("user_id", profile?.id)
      .eq("friend_id", friendId);
    setFriends(friends.filter((f) => f.id !== friendId));
  };

  // Handler: Stuur een vriendverzoek
  const handleSendFriendRequest = async (addresseeId: string) => {
    try {
      await sendFriendRequest(addresseeId);
      setRequestFeedback("Verzoek verstuurd! Tijd voor koffie?");
      // Refresh outgoing requests
      if (profile) {
        const outgoing = await getOutgoingFriendRequests(profile.id);
        setOutgoingRequests(outgoing);
      }
    } catch (e: any) {
      setRequestFeedback(e.message || "Oeps! Er ging iets mis.");
    }
    setTimeout(() => setRequestFeedback(null), 3000);
  };

  // Handler: Accepteer een verzoek
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      setRequestFeedback("Nieuwe koffie-vriend! ☕️");
      // Refresh friends & incoming requests
      if (profile) {
        setFriends(await getFriends(profile.id));
        setIncomingRequests(await getIncomingFriendRequests(profile.id));
      }
    } catch (e: any) {
      setRequestFeedback(e.message || "Oeps! Er ging iets mis.");
    }
    setTimeout(() => setRequestFeedback(null), 3000);
  };

  // Handler: Weiger een verzoek
  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      setRequestFeedback("Misschien een andere keer! 🚫");
      // Refresh incoming requests
      if (profile) {
        setIncomingRequests(await getIncomingFriendRequests(profile.id));
      }
    } catch (e: any) {
      setRequestFeedback(e.message || "Oeps! Er ging iets mis.");
    }
    setTimeout(() => setRequestFeedback(null), 3000);
  };

  // Zoek gebruikers behalve jezelf en bestaande vrienden
  const handleUserSearch = useCallback(async () => {
    if (!userSearch.trim() || !profile) {
      setUserResults([]);
      return;
    }
    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, emoji, email")
      .ilike("full_name", `%${userSearch.trim()}%`)
      .neq("id", profile.id);
    if (error) {
      setUserResults([]);
      setSearching(false);
      return;
    }
    // Filter bestaande vrienden en pending/outgoing requests
    const excludeIds = new Set([
      profile.id,
      ...friends.map((f) => f.id),
      ...outgoingRequests.map((r) => r.addressee_id),
    ]);
    // Map naar Profile type (full_name -> fullName)
    const mapped = (data || []).filter((u) => !excludeIds.has(u.id)).map((u) => ({
      id: u.id,
      fullName: u.full_name,
      emoji: u.emoji,
      email: u.email,
    }));
    setUserResults(mapped);
    setSearching(false);
  }, [userSearch, profile, friends, outgoingRequests]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleUserSearch();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [userSearch, handleUserSearch]);

  return (
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
            {t("dashboard.welcome")}, {profile?.fullName || t("dashboard.user")}
            !
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

      {/* Friends Tabs Section */}
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "friends" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"}`}
            onClick={() => setActiveTab("friends")}
          >
            {t("dashboard.friends", "Friends")}
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "outgoing" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"}`}
            onClick={() => setActiveTab("outgoing")}
          >
            {t("dashboard.outgoingRequests", "Outgoing Requests")}
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === "incoming" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"}`}
            onClick={() => setActiveTab("incoming")}
          >
            {t("dashboard.incomingRequests", "Incoming Requests")}
          </button>
        </div>

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <>
            <input
              type="text"
              className="border rounded px-2 py-1 w-full mb-3"
              placeholder={t("dashboard.searchFriends")}
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
            />
            {filteredFriends.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredFriends.map((friend) => (
                  <li
                    key={friend.id}
                    className="flex items-center gap-2 bg-white/80 rounded-xl shadow px-4 py-2 border border-primary-100"
                  >
                    {friend.emoji && (
                      <span className="text-2xl" title={friend.fullName}>
                        {friend.emoji}
                      </span>
                    )}
                    <span className="font-semibold text-primary-700">
                      {friend.fullName}
                    </span>
                    {friend.email ? (
                      <span className="ml-2 text-green-600 text-xs font-semibold">
                        {t("dashboard.hasAccount", "Has account")}
                      </span>
                    ) : (
                      <span className="ml-2 text-gray-400 text-xs">
                        {t("dashboard.noAccount", "No account")}
                      </span>
                    )}
                    {friend.email && (
                      <button
                        className="ml-2 btn-secondary text-xs px-2 py-1"
                        onClick={() =>
                          navigate(`/create-meetup?invite=${friend.id}`)
                        }
                      >
                        {t("dashboard.inviteToMeetup", "Invite to meetup")}
                      </button>
                    )}
                    <button
                      className="ml-2 text-red-500 hover:underline text-xs"
                      onClick={() => handleRemoveFriend(friend.id)}
                    >
                      {t("dashboard.removeFriend", "Remove")}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic mt-2">
                {
                  [
                    "No friends yet! Time to make some ☕️ connections!",
                    "Still a bit lonely here... Invite someone for coffee!",
                    "Your friend list is as empty as a Monday morning mug.",
                    "No friends yet, but every coffee legend starts somewhere!",
                  ][Math.floor(Math.random() * 4)]
                }
              </div>
            )}
          </>
        )}

        {/* Outgoing Requests Tab */}
        {activeTab === "outgoing" && (
          <>
            {outgoingRequests.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {outgoingRequests.map((req) => (
                  <li key={req.id} className="flex items-center gap-2 bg-white/80 rounded-xl shadow px-4 py-2 border border-primary-100">
                    <span className="font-semibold text-primary-700">
                      {req.addressee_id}
                    </span>
                    <span className={`ml-2 text-xs font-semibold ${req.status === 'pending' ? 'text-yellow-600' : req.status === 'accepted' ? 'text-green-600' : 'text-gray-400'}`}>{req.status === 'pending' ? 'Wachten...' : req.status === 'accepted' ? 'Geaccepteerd!' : 'Geweigerd'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic mt-2">
                {[
                  "Je hebt nog geen verzoeken verstuurd. Tijd om iemand uit te nodigen!",
                  "Niemand op de koffie-radar? Stuur een verzoek!",
                  "Je uitgaande verzoekenlijst is net zo leeg als een koffiekopje na een goed gesprek.",
                ][Math.floor(Math.random() * 3)]}
              </div>
            )}
          </>
        )}

        {/* Incoming Requests Tab */}
        {activeTab === "incoming" && (
          <>
            {incomingRequests.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {incomingRequests.filter((req) => req.status === 'pending').map((req) => (
                  <li key={req.id} className="flex items-center gap-2 bg-white/80 rounded-xl shadow px-4 py-2 border border-primary-100">
                    <span className="font-semibold text-primary-700">
                      {req.requester_id}
                    </span>
                    <button className="ml-2 btn-primary text-xs px-2 py-1" onClick={() => handleAcceptRequest(req.id)}>
                      {t("dashboard.accept", "Accepteren")}
                    </button>
                    <button className="ml-2 btn-secondary text-xs px-2 py-1" onClick={() => handleRejectRequest(req.id)}>
                      {t("dashboard.reject", "Weigeren")}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500 italic mt-2">
                {[
                  "Geen nieuwe verzoeken. Iedereen is al aan de koffie!",
                  "Niemand klopt nu op je koffie-deur.",
                  "Nog geen verzoeken. Misschien zelf iemand uitnodigen?",
                ][Math.floor(Math.random() * 3)]}
              </div>
            )}
          </>
        )}
        {requestFeedback && (
          <div className="mt-4 text-center text-primary-700 font-semibold animate-bounce">
            {requestFeedback}
          </div>
        )}
      </div>

      {/* Zoek & voeg vriend toe */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-primary-700 mb-2">Nieuwe vriend zoeken</h2>
        <input
          type="text"
          className="border rounded px-2 py-1 w-full mb-2"
          placeholder="Zoek op naam..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />
        {searching && <div className="text-gray-400 italic">Even zoeken...</div>}
        {!searching && userSearch && userResults.length === 0 && (
          <div className="text-gray-500 italic">Geen matches gevonden. Misschien typfoutje? Of iedereen is al je vriend!</div>
        )}
        {!searching && userResults.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {userResults.map((user) => (
              <li key={user.id} className="flex items-center gap-2 bg-white/80 rounded-xl shadow px-4 py-2 border border-primary-100">
                {user.emoji && <span className="text-2xl" title={user.fullName}>{user.emoji}</span>}
                <span className="font-semibold text-primary-700">{user.fullName}</span>
                <button
                  className="ml-2 btn-primary text-xs px-2 py-1"
                  onClick={() => handleSendFriendRequest(user.id)}
                  disabled={!!outgoingRequests.find((r) => r.addressee_id === user.id)}
                >
                  {outgoingRequests.find((r) => r.addressee_id === user.id) ? "Verzoek verstuurd!" : "Stuur koffie-verzoek!"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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
  );
};

export default Dashboard;
