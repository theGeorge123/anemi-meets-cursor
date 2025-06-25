import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/supabaseClient';
import FormStatus from '@/components/FormStatus';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { Database } from '@/types/supabase';

type Invite = Database['public']['Tables']['friend_invites']['Row'];
// type Profile = Database['public']['Tables']['profiles']['Row'];

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

type StatusType = 'success' | 'error' | 'loading' | 'idle';

export default function InviteFriend(): JSX.Element {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<Invite | null>(null);
  // const [inviterProfile, setInviterProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<StatusType>('idle');

  useEffect(() => {
    const fetchInvite = async (): Promise<void> => {
      if (!token) return;

      const { data: inviteData, error } = await supabase
        .from('friend_invites')
        .select('*')
        .eq('token', token)
        .single<Invite>();

      if (error || !inviteData) {
        setStatus('error');
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.rpc('accept_friend_invite' as any, { token });

      if (error) throw error;
      navigate('/dashboard');
    } catch (err) {
      setStatus('error');
    }
  }, [invite, token, navigate]);

  return (
    <ErrorBoundary>
      {status !== 'idle' && (
        <FormStatus
          type={status === 'loading' ? 'info' : (status as 'success' | 'error' | 'info')}
          msg={
            status === 'loading'
              ? t('inviteFriend.loading')
              : status === 'error'
                ? t('inviteFriend.error')
                : t('inviteFriend.success')
          }
        />
      )}

      {/* …invite preview UI using inviterProfile… */}

      <button type="button" onClick={handleAccept}>
        {t('inviteFriend.accept')}
      </button>
    </ErrorBoundary>
  );
}
