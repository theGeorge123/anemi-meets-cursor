import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getProfile } from '../services/profileService';
import { useTranslation } from 'react-i18next';
import { User } from '@supabase/supabase-js';
import LoadingIndicator from '../components/LoadingIndicator';
import FormStatus from '../components/FormStatus';

const InviteFriend = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviter, setInviter] = useState<{ fullName: string; emoji?: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError(null);
      if (!token) {
        setError(t('inviteFriend.invalid', 'Invalid invite link.'));
        setLoading(false);
        return;
      }

      try {
        const { data: invite, error: inviteError } = await supabase
          .from('friend_invites')
          .select('id, inviter_id, invitee_email')
          .eq('token', token)
          .eq('status', 'pending')
          .maybeSingle();

        if (inviteError || !invite) {
          setError(t('inviteFriend.invalid', 'Invalid or expired invite link.'));
          return;
        }

        const { data: inviterProfile } = await getProfile(invite.inviter_id);
        if (inviterProfile) {
          setInviter({
            fullName: inviterProfile.fullname ?? 'A friend',
            emoji: inviterProfile.emoji ?? '👤',
          });
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (e: any) {
        setError(e.message || t('common.error_unexpected'));
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [token, t]);

  const handleAccept = useCallback(async () => {
    if (!user || !token) return;

    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('accept-friend-invite', {
        body: { token, email: user.email },
      });

      if (response.error) throw response.error;

      navigate('/friends?accepted=true');
    } catch (e: any) {
      setError(e.message || t('inviteFriend.errorAccept', 'Could not accept invite.'));
    } finally {
      setLoading(false);
    }
  }, [user, token, navigate, t]);

  const redirectToAuth = (mode: 'login' | 'signup') => {
    navigate(`/${mode}`, { state: { from: location } });
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <FormStatus status="error" message={error} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      <div className="card bg-primary-50">
        {inviter && (
          <>
            <div className="mb-6">
              <span className="text-5xl">{inviter.emoji}</span>
              <h1 className="text-2xl font-bold mt-4">
                {t('inviteFriend.inviteFrom', { name: inviter.fullName })}
              </h1>
              <p className="text-gray-600 mt-2">{t('inviteFriend.joinPrompt')}</p>
            </div>

            {user ? (
              <div className="space-y-4">
                <p>
                  {t('inviteFriend.loggedInAs', 'You are logged in as')}{' '}
                  <strong>{user.email}</strong>.
                </p>
                <button className="btn-primary w-full" onClick={handleAccept} disabled={loading}>
                  {loading
                    ? t('common.loading')
                    : t('inviteFriend.accept', 'Accept & Become Friends')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="font-semibold">{t('inviteFriend.loginToAccept')}</p>
                <button
                  className="btn-primary w-full"
                  onClick={() => redirectToAuth('signup')}
                >
                  {t('inviteFriend.signupAndAccept', 'Sign Up to Accept')}
                </button>
                <button
                  className="btn-secondary w-full"
                  onClick={() => redirectToAuth('login')}
                >
                  {t('inviteFriend.loginAndAccept', 'Log In to Accept')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InviteFriend;
