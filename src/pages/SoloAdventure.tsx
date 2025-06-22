import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/supabaseClient';
import ErrorBoundary from '@/components/ErrorBoundary';
import FormStatus from '@/components/FormStatus';

interface ScheduleResponse {
  id: string;
  created_at: string;
}

export default function SoloAdventure(): JSX.Element {
  const { t } = useTranslation();

  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // const handleSchedule = useCallback(async (cafeId: string) => {
  //   setError(null);
  //   setScheduleSuccess(null);

  //   try {
  //     const { data, error: dbError } = await supabase
  //       .from('solo_schedules')
  //       .insert({ cafe_id: cafeId })
  //       .select<ScheduleResponse>()
  //       .single();

  //     if (dbError) throw dbError;
  //     if (!data) throw new Error(t('solo.errorSchedule'));

  //     setScheduleSuccess(t('solo.scheduleSuccess'));
  //   } catch (err) {
  //     if (err instanceof Error) {
  //       setError(err.message ?? t('solo.errorSchedule'));
  //     } else {
  //       setError(t('solo.errorSchedule'));
  //     }
  //   }
  // }, [t]);

  return (
    <ErrorBoundary>
      {/* …other UI… */}
      {error && <FormStatus status="error" message={error} />}
      {scheduleSuccess && <FormStatus status="success" message={scheduleSuccess} />}
      {/* …other UI… */}
    </ErrorBoundary>
  );
}
