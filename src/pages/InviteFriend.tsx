import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getProfile } from '../services/supabaseService';
import { useTranslation } from 'react-i18next';

const InviteFriend = () => {
  const { token } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviter, setInviter] = useState<{ fullName: string; emoji?: string } | null>(null);

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
      const { data: inviterProfile } = await getProfile(invite.inviter_id);
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
    // Accept friendship: ensure both directions are 'accepted'
    const userId = session.user.id;
    const inviterId = invite.inviter_id;
    // Update both rows if they exist, otherwise insert
    await supabase.from('friendships').upsert([
      { user_id: inviterId, friend_id: userId, status: 'accepted' },
      { user_id: userId, friend_id: inviterId, status: 'accepted' }
    ], { onConflict: 'user_id,friend_id' });
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
            <div className="mt-2 text-lg">{t('inviteFriend.inviteFrom', 'You have been invited by')} <b>{inviter.fullName}</b></div>
          </div>
          <button className="btn-primary" onClick={handleAccept}>{t('inviteFriend.accept', 'Accept invite')}</button>
        </>
      )}
    </div>
  );
};

export default InviteFriend;
