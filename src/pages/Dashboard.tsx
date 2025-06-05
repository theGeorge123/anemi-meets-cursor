import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import LoadingIndicator from '../components/LoadingIndicator';
import SkeletonLoader from '../components/SkeletonLoader';
import OnboardingModal from '../components/OnboardingModal';

interface Invitation {
  id: string;
  selected_date: string;
  selected_time: string;
  cafe_id?: string;
  cafe_name?: string;
  status: string;
  email_b?: string;
}

interface Profile {
  id: string;
  full_name: string;
  emoji?: string;
  last_seen?: string;
}

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [meetups, setMeetups] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }
      // Update last_seen on dashboard visit
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', session.user.id);
      // Onboarding check: only show for first-time users
      if (!localStorage.getItem('anemi-onboarded')) {
        setShowOnboarding(true);
      }
      // Profiel ophalen (inclusief last_seen)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, emoji, last_seen')
        .eq('id', session.user.id)
        .maybeSingle();
      setProfile(profileData as Profile);
      // Meetups ophalen
      const { data, error } = await supabase
        .from('invitations')
        .select('id, selected_date, selected_time, cafe_id, cafe_name, status, email_b')
        .or(`invitee_id.eq.${session.user.id},email_b.eq."${session.user.email}"`);
      if (error) {
        setError(t('dashboard.errorLoadingMeetups'));
      } else {
        setMeetups((data || []) as Invitation[]);
      }
      setLoading(false);
    };
    fetchData();
  }, [navigate, t]);

  // Sorteer meetups op datum (oplopend)
  const sortedMeetups = [...meetups].sort((a, b) => a.selected_date.localeCompare(b.selected_date));
  const upcoming = sortedMeetups.filter(m => new Date(m.selected_date) >= new Date());
  const lastActivity = sortedMeetups.length > 0 ? sortedMeetups[sortedMeetups.length - 1] : null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {showOnboarding && (
        <OnboardingModal onFinish={() => {
          setShowOnboarding(false);
          localStorage.setItem('anemi-onboarded', '1');
        }} />
      )}
      {/* Welkomstbericht */}
      <div className="flex items-center gap-3 mb-6">
        {profile?.emoji && <span className="text-4xl" title={profile.full_name}>{profile.emoji}</span>}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-700 mb-1">
            {t('dashboard.welcome')}, {profile?.full_name || t('dashboard.user')}!
          </h1>
          {profile && (
            <div className="text-gray-600 text-sm">
              {t('dashboard.lastLogin', { date: profile.last_seen ? new Date(profile.last_seen).toLocaleDateString() : '' })}
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