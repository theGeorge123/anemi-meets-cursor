import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/supabaseClient';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Link, useNavigate } from 'react-router-dom';
import { Invitation, SoloAdventure, Profile } from '@/types';
import { useOnboarding } from '@/context/OnboardingContext';
import OnboardingModal from '@/features/dashboard/components/OnboardingModal';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function Dashboard(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showOnboarding, completeOnboarding } = useOnboarding();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [soloAdventures, setSoloAdventures] = useState<SoloAdventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        setError(t('dashboard.error.session'));
        setLoading(false);
        navigate('/login');
        return;
      }

      const userId = session.user.id;

      // Fetch Profile
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          setError(
            t('dashboard.error.profile', {
              details: profileError instanceof Error ? profileError.message : String(profileError),
            }),
          );
          setProfile(null);
        } else {
          setProfile(profileData as unknown as Profile);
        }
      } catch (err: unknown) {
        setError(
          t('dashboard.error.profile', {
            details: err instanceof Error ? err.message : String(err),
          }),
        );
        setProfile(null);
      }

      // Fetch Invitations
      try {
        const { data: invitationsData, error: invitationsError } = await supabase
          .from('invitations')
          .select('*')
          .or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`)
          .filter('status', 'eq', 'confirmed');

        if (invitationsError) {
          setError(
            t('dashboard.error.meetups', {
              details:
                invitationsError instanceof Error
                  ? invitationsError.message
                  : String(invitationsError),
            }),
          );
        } else {
          setInvitations(invitationsData as unknown as Invitation[]);
        }
      } catch (err: unknown) {
        setError(
          t('dashboard.error.meetups', {
            details: err instanceof Error ? err.message : String(err),
          }),
        );
        setInvitations([]);
      }

      // Fetch Solo Adventures
      try {
        const { data: soloAdventuresData, error: soloAdventuresError } = await supabase
          .from('solo_adventures')
          .select(
            `
            *,
            cafes (
              name,
              address
            )
          `,
          )
          .eq('user_id', userId);

        if (soloAdventuresError) {
          setError(
            t('dashboard.error.solo', {
              details:
                soloAdventuresError instanceof Error
                  ? soloAdventuresError.message
                  : String(soloAdventuresError),
            }),
          );
        } else {
          setSoloAdventures(soloAdventuresData as unknown as SoloAdventure[]);
        }
      } catch (err: unknown) {
        setError(
          t('dashboard.error.solo', { details: err instanceof Error ? err.message : String(err) }),
        );
        setSoloAdventures([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [t, navigate]);

  return (
    <ErrorBoundary>
      {showOnboarding && <OnboardingModal onFinish={completeOnboarding} />}
      <section className="max-w-4xl mx-auto p-4 grid gap-8">
        {loading ? (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-primary-100/50">
            <SkeletonLoader className="h-20" />
          </div>
        ) : profile ? (
          <div className="bg-gradient-to-br from-[#fff7f3] to-[#b2dfdb]/30 p-6 rounded-2xl shadow-lg flex justify-between items-center border border-white/50">
            <div>
              <h1 className="text-3xl font-bold text-primary-800">
                {t('dashboard.welcome', { name: profile.fullname || 'Friend' })}
              </h1>
              <p className="text-primary-700 mt-1">{t('dashboard.subtitle')}</p>
            </div>
            <div className="text-6xl animate-wiggle">{profile.emoji || '👋'}</div>
          </div>
        ) : null}

        {error && (
          <div className="text-red-600 bg-red-100 p-4 rounded-lg shadow-inner">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/create-meetup')}
            className="bg-primary-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-primary-600 transition-all transform hover:scale-105 active:bg-primary-700 flex items-center justify-center gap-3 text-lg"
          >
            <span className="text-2xl">☕️</span> {t('dashboard.planMeetup')}
          </button>
          <button
            onClick={() => navigate('/solo-adventure')}
            className="bg-secondary-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-secondary-600 transition-all transform hover:scale-105 active:bg-secondary-700 flex items-center justify-center gap-3 text-lg"
          >
            <span className="text-2xl">🧘</span> {t('dashboard.soloAdventure')}
          </button>
        </div>

        <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-primary-100/30">
          <h2 className="text-2xl font-semibold mb-4 text-primary-800">
            {t('dashboard.upcoming')}
          </h2>
          {loading ? (
            <div className="grid gap-4">
              <SkeletonLoader className="h-16" />
              <SkeletonLoader className="h-16" />
            </div>
          ) : (
            <div className="grid gap-4">
              {invitations.length === 0 && soloAdventures.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t('dashboard.noUpcoming')}</p>
                </div>
              ) : (
                <>
                  {invitations.map((invite) => (
                    <Link
                      to={`/meetups/${invite.id}`}
                      key={invite.id}
                      className="block bg-white/80 p-4 rounded-lg shadow-md hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                      <p className="font-semibold text-primary-700">{t('dashboard.meetupWith')}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(invite.meetup_date).toLocaleString(undefined, {
                          dateStyle: 'long',
                          timeStyle: 'short',
                        })}
                      </p>
                    </Link>
                  ))}
                  {soloAdventures.map((adventure) => (
                    <Link
                      to={`/solo-adventure`}
                      key={adventure.id}
                      className="block bg-white/80 p-4 rounded-lg shadow-md hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                      <p className="font-semibold text-secondary-800">
                        {t('dashboard.soloAdventureTitle')} @ {adventure.cafes?.name || 'een café'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(adventure.adventure_date).toLocaleString(undefined, {
                          dateStyle: 'long',
                          timeStyle: 'short',
                        })}
                      </p>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <div className="text-center mt-4">
          <Link to="/account" className="text-primary-600 hover:underline">
            {t('dashboard.settings')}
          </Link>
        </div>
      </section>
    </ErrorBoundary>
  );
}
