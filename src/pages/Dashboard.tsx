import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/supabaseClient';
import ErrorBoundary from '@/components/ErrorBoundary';
import FormStatus from '@/components/FormStatus';
import type { Database } from '@/types/supabase';

type Meetup = Database['public']['Tables']['meetups']['Row'];
type Cafe = Database['public']['Tables']['cafes']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface MeetupWithDetails extends Meetup {
  cafes: Cafe;
  meetups_participants: { profiles: Profile }[];
}

export default function Dashboard(): JSX.Element {
  const { t } = useTranslation();
  const [meetups, setMeetups] = useState<MeetupWithDetails[]>([]);
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; msg: string } | null>(null);

  useEffect(() => {
    const fetchMeetups = async (): Promise<void> => {
      const { data, error } = await supabase
        .from('meetups')
        .select(
          `
          *,
          cafes (*),
          meetups_participants (
            profiles (*)
          )
        `,
        )
        .returns<MeetupWithDetails[]>();

      if (error) {
        setStatus({ kind: 'error', msg: error.message });
        return;
      }

      setMeetups(data ?? []);
    };

    fetchMeetups();
  }, []);

  return (
    <ErrorBoundary>
      {status && <FormStatus status={status.kind} message={status.msg} />}

      <section className="grid gap-4">
        {meetups.map((m) => (
          <article key={m.id} className="rounded-xl p-4 shadow">
            <h2 className="text-xl font-semibold">{m.title}</h2>
            <p className="text-sm">
              {t('dashboard.at')} {m.cafes.name} &mdash;{' '}
              {new Date(m.starts_at).toLocaleDateString()}
            </p>

            <h3 className="mt-2 text-sm font-medium">{t('dashboard.participants')}</h3>
            <ul className="ml-4 list-disc">
              {m.meetups_participants.map((p) => (
                <li key={p.profiles.id}>
                  {p.profiles.fullname} {p.profiles.emoji}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </ErrorBoundary>
  );
}
