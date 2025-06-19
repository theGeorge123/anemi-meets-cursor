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
        .from('friend_invites')
        .select('id, inviter_id, accepted, invitee_email')
        .eq('token', token)
        .maybeSingle();
      if (inviteError || !invite) {
        setError(t('inviteFriend.invalid', 'Invalid or expired invite link.'));
        setLoading(false);
        return;
      }
      if (invite.accepted) {
        setError(t('inviteFriend.alreadyAccepted', 'This invite has already been used.'));
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
  }, [token, t]);

  // Accept as guest (no login)
  const handleAcceptGuest = async () => {
    setAcceptLoading(true);
    setAcceptError(null);
    try {
      // Accept invite by updating friend_invites (RLS policy allows by email)
      const { error } = await supabase
        .from('friend_invites')
        .update({ accepted: true, accepted_at: new Date().toISOString() })
        .eq('token', token)
        .eq('invitee_email', email);
      if (error) {
        setAcceptError(t('inviteFriend.errorAccept', 'Could not accept invite.'));
        setAcceptLoading(false);
        return;
      }
      setAcceptSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
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
      <h1 className="text-2xl font-bold mb-4">{t('inviteFriend.title', 'Accept Friend Invite')}</h1>
      {loading && <div>{t('loading')}</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {acceptSuccess && (
        <div className="text-green-600 font-semibold mb-4">
          {t('inviteFriend.success', 'You are now friends! Redirecting...')}
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
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <button
              className="btn-primary w-full sm:w-auto"
              onClick={handleAcceptGuest}
              disabled={acceptLoading || !email}
            >
              {acceptLoading ? t('loading') : t('inviteFriend.stayStranger', 'Stay a stranger')}
            </button>
            <button className="btn-secondary w-full sm:w-auto" onClick={handleSignupRedirect}>
              {t('inviteFriend.joinFamily', 'Join the family')}
            </button>
          </div>
          {acceptError && <div className="text-red-500 mb-4">{acceptError}</div>}
        </>
      )}
    </div>
  );
};

export default InviteFriend;
