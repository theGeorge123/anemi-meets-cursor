import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

interface Invitation {
  id: string;
  selected_date: string;
  selected_time: string;
  cafe_id?: string;
  cafe_name?: string;
  status: string;
  email_b?: string;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const [meetups, setMeetups] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetups = async () => {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }
      const { data, error } = await supabase
        .from('invitations')
        .select('id, selected_date, selected_time, cafe_id, cafe_name, status, email_b')
        .or(`invitee_id.eq.${session.user.id},email_b.eq."${session.user.email}"`);
      if (error) {
        setError(t('account.errorLoadingMeetups'));
      } else {
        setMeetups((data || []) as Invitation[]);
      }
      setLoading(false);
    };
    fetchMeetups();
  }, [navigate, t]);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-primary-700 mb-6">{t('dashboard.title')}</h1>
      {loading && <div className="text-gray-500 flex items-center gap-2"><span className="animate-spin w-5 h-5 border-2 border-primary-600 border-t-[#ff914d] rounded-full inline-block"></span> {t('common.loading')}</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {!loading && !error && meetups.length === 0 && (
        <div className="text-gray-600 text-center">{t('dashboard.noMeetups')}</div>
      )}
      {!loading && !error && meetups.length > 0 && (
        <ul className="space-y-4">
          {meetups.map(m => (
            <li key={m.id} className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-semibold">{m.selected_date}</span>
                {m.selected_time && <span> &bull; {m.selected_time}</span>}
                {m.cafe_name && <span> &bull; {m.cafe_name}</span>}
                {!m.cafe_name && m.cafe_id && <span> &bull; Café {m.cafe_id}</span>}
              </div>
              <span className="text-xs text-gray-600 mt-1 sm:mt-0">{m.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dashboard; 