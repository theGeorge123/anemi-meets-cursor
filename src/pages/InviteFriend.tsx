import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

const InviteFriend = () => {
  const { token } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviter, setInviter] = useState<{ full_name: string; emoji?: string } | null>(null);

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
        .select('id, inviter_id, accepted')
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
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('full_name, emoji')
        .eq('id', invite.inviter_id)
        .maybeSingle();
      setInviter(inviterProfile);
      setLoading(false);
    };
    checkInvite();
  }, [token, t]);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError(t('inviteFriend.loginFirst', 'Please log in to accept the invite.'));
      setLoading(false);
      return;
    }
    // Get invite
    const { data: invite } = await supabase
      .from('friend_invites')
      .select('id, inviter_id, accepted')
      .eq('token', token)
      .maybeSingle();
    if (!invite || invite.accepted) {
      setError(t('inviteFriend.invalid', 'Invalid or expired invite link.'));
      setLoading(false);
      return;
    }
    // Create friendship (pending for inviter, accepted for invitee)
    const { error: friendshipError } = await supabase.from('friendships').insert([
      { user_id: invite.inviter_id, friend_id: session.user.id, status: 'pending' },
      { user_id: session.user.id, friend_id: invite.inviter_id, status: 'accepted' }
    ]);
    if (friendshipError) {
      setError(t('inviteFriend.error', 'Could not add friend. Maybe you are already friends?'));
      setLoading(false);
      return;
    }
    // Mark invite as accepted
    await supabase.from('friend_invites').update({ accepted: true, accepted_at: new Date().toISOString(), invitee_email: session.user.email }).eq('token', token);
    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">{t('inviteFriend.title', 'Accept Friend Invite')}</h1>
      {loading && <div>{t('loading')}</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {success && <div className="text-green-600 font-semibold mb-4">{t('inviteFriend.success', 'You are now friends! Redirecting...')}</div>}
      {!loading && !error && !success && inviter && (
        <>
          <div className="mb-6">
            <span className="text-4xl">{inviter.emoji || '👤'}</span>
            <div className="mt-2 text-lg">{t('inviteFriend.inviteFrom', 'You have been invited by')} <b>{inviter.full_name}</b></div>
          </div>
          <button className="btn-primary" onClick={handleAccept}>{t('inviteFriend.accept', 'Accept invite')}</button>
        </>
      )}
    </div>
  );
};

export default InviteFriend; 