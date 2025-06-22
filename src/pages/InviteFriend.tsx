import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/supabaseClient';
import FormStatus from '@/components/FormStatus';
import Toast from '@/components/Toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { Database } from '@/types/supabase';

type Invite = Database['public']['Tables']['friend_invites']['Row'];
// type Profile = Database['public']['Tables']['profiles']['Row'];

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export default function InviteFriend(): JSX.Element {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<Invite | null>(null);
  // const [inviterProfile, setInviterProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; msg: string } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const fetchInvite = async (): Promise<void> => {
      if (!token) return;

      const { data: inviteData, error } = await supabase
        .from('friend_invites')
        .select('*')
        .eq('token', token)
        .single<Invite>();

      if (error || !inviteData) {
        setStatus({ kind: 'error', msg: t('inviteFriend.invalidToken') });
        return;
      }

      setInvite(inviteData);

      if (inviteData.inviter_id) {
        // const { data: profileData } = await supabase
        //   .from('profiles')
        //   .select('fullname, emoji')
        //   .eq('id', inviteData.inviter_id)
        //   .single<Profile>();
        // if (profileData) setInviterProfile(profileData);
      }
    };

    fetchInvite();
  }, [token, t]);

  const handleAccept = useCallback(async (): Promise<void> => {
    if (!invite) return;

    try {
      const { error } = await supabase.rpc('accept_friend_invite' as any, { token });

      if (error) throw error;
      setToast({ message: t('inviteFriend.success'), type: 'success' });
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('inviteFriend.errorAccept');
      setStatus({ kind: 'error', msg });
    }
  }, [invite, token, t, navigate]);

  return (
    <ErrorBoundary>
      {status && <FormStatus status={status.kind} message={status.msg} />}

      {/* …invite preview UI using inviterProfile… */}

      <button type="button" onClick={handleAccept}>
        {t('inviteFriend.accept')}
      </button>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </ErrorBoundary>
  );
}
