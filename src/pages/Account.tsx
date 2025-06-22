import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/supabaseClient';
import ErrorBoundary from '@/components/ErrorBoundary';
import FormStatus from '@/components/FormStatus';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UpdateableField = 'fullname' | 'emoji' | 'wantsupdates' | 'wantsreminders' | 'isprivate';

export default function Account(): JSX.Element {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; msg: string } | null>(null);

  useEffect(() => {
    (async (): Promise<void> => {
      const { data, error } = await supabase.from('profiles').select('*').single<Profile>();

      if (error) {
        setStatus({ kind: 'error', msg: error.message });
        return;
      }
      setProfile(data);
    })();
  }, []);

  const handleUpdate = useCallback(
    async (field: UpdateableField, value: string | boolean): Promise<void> => {
      setStatus(null);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ [field]: value })
          .eq('id', profile?.id);

        if (error) throw error;
        setProfile((prev) => (prev ? ({ ...prev, [field]: value } as Profile) : prev));
        setStatus({ kind: 'success', msg: t('account.updateSuccess') });
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('account.updateError');
        setStatus({ kind: 'error', msg });
      }
    },
    [profile?.id, t],
  );

  const onCheckboxChange = (field: UpdateableField) => (e: ChangeEvent<HTMLInputElement>) =>
    handleUpdate(field, e.target.checked);

  return (
    <ErrorBoundary>
      {status && <FormStatus status={status.kind} message={status.msg} />}

      {/* Full name & emoji inputs omitted for brevity */}

      <label>
        <input
          type="checkbox"
          checked={profile?.wantsupdates ?? false}
          onChange={onCheckboxChange('wantsupdates')}
        />
        {t('account.wantsUpdates')}
      </label>

      <label>
        <input
          type="checkbox"
          checked={profile?.wantsreminders ?? false}
          onChange={onCheckboxChange('wantsreminders')}
        />
        {t('account.wantsReminders')}
      </label>

      <label>
        <input
          type="checkbox"
          checked={profile?.isprivate ?? false}
          onChange={onCheckboxChange('isprivate')}
        />
        {t('account.isPrivate')}
      </label>
    </ErrorBoundary>
  );
}
