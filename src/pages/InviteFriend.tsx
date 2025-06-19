import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getProfile } from '../services/profileService';
import { useTranslation } from 'react-i18next';

const InviteFriend = () => {
  const { token } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviter, setInviter] = useState<{ fullName: string; emoji?: string } | null>(null);
  const [email, setEmail] = useState('');
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkInvite = async () => {
      setLoading(true);
      setError(null);
      if (!token) {
        setError(t('inviteFriend.invalid', 'Invalid invite link.'));
        setLoading(false);
        return;
      }
      // Get invite
      const { data: invite, error: inviteError } = await supabase
        .from('meeting_invites')
        .select('id, inviter_id, status, invitee_email, expires_at')
        .eq('token', token)
        .maybeSingle();
      if (inviteError || !invite) {
        setError(t('inviteFriend.invalid', 'Invalid or expired invite link.'));
        setLoading(false);
        return;
      }
      if (invite.status === 'accepted') {
        setError(t('inviteFriend.alreadyAccepted', 'This invite has already been used.'));
        setLoading(false);
        return;
      }
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        setError(t('inviteFriend.invalid', 'This invite has expired.'));
        setLoading(false);
        return;
      }
      // Get inviter profile
      const { data: inviterProfile } = await getProfile(invite.inviter_id);
      setInviter(inviterProfile);
      setEmail(invite.invitee_email || '');
      setLoading(false);
    };
    checkInvite();
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
  }, [token, t]);

  // Accept invite (guest or logged in)
  const handleAcceptInvite = async () => {
    setAcceptLoading(true);
    setAcceptError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      let res, body;
      if (session?.user) {
        // Authenticated flow
        res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-meeting-invite`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ token }),
          },
        );
      } else {
        // Guest flow
        if (!email) {
          setAcceptError(t('inviteFriend.errorAccept', 'Please enter your email.'));
          setAcceptLoading(false);
          return;
        }
        res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-meeting-invite`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ token, inviteeEmail: email }),
          },
        );
      }
      body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        setAcceptError(body.error || t('inviteFriend.errorAccept', 'Could not accept invite.'));
        setAcceptLoading(false);
        return;
      }
      setAcceptSuccess(true);
      setTimeout(() => {
        if (isLoggedIn) {
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      }, 2000);
    } catch (err: unknown) {
      setAcceptError(
        err instanceof Error
          ? err.message
          : t('inviteFriend.errorAccept', 'Could not accept invite.'),
      );
    }
    setAcceptLoading(false);
  };

  // Redirect to signup with token (auto-friendship after signup)
  const handleSignupRedirect = () => {
    navigate(`/signup?invite_token=${token}`);
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">
        {t('inviteFriend.title', 'Accept Meeting Invite')}
      </h1>
      {loading && <div>{t('loading')}</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {acceptSuccess && (
        <div className="text-green-600 font-semibold mb-4">
          {isLoggedIn
            ? t('inviteFriend.success', 'You are now friends! Redirecting...')
            : t('inviteFriend.successGuest', 'Meeting accepted! Check your email. Redirecting...')}
        </div>
      )}
      {!loading && !error && !acceptSuccess && inviter && (
        <>
          <div className="mb-6">
            <span className="text-4xl">{inviter.emoji || '👤'}</span>
            <div className="mt-2 text-lg">
              {t('inviteFriend.inviteFrom', 'You have been invited by')} <b>{inviter.fullName}</b>
            </div>
          </div>
          <div className="mb-6">
            <label className="block mb-2 font-semibold" htmlFor="email">
              {t('inviteFriend.yourEmail', 'Your email')}
            </label>
            <input
              id="email"
              type="email"
              className="input-field max-w-xs mx-auto"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('inviteFriend.emailPlaceholder', 'Enter your email')}
              required
              disabled={isLoggedIn}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <button
              className="btn-primary w-full sm:w-auto"
              onClick={handleAcceptInvite}
              disabled={acceptLoading || (!isLoggedIn && !email)}
            >
              {acceptLoading ? t('loading') : t('inviteFriend.accept', 'Accept Invite')}
            </button>
            {!isLoggedIn && (
              <button className="btn-secondary w-full sm:w-auto" onClick={handleSignupRedirect}>
                {t('inviteFriend.signupAndAccept', 'Sign up & add to dashboard')}
              </button>
            )}
          </div>
          {acceptError && <div className="text-red-500 mb-4">{acceptError}</div>}
        </>
      )}
    </div>
  );
};

export default InviteFriend;
