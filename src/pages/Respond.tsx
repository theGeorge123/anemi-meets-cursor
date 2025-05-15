import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Respond = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    selectedTime: '',
  });
  const [availableTimes, setAvailableTimes] = useState<{date: string, time: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      if (!token) {
        setError('Geen geldige uitnodiging gevonden.');
        setLoading(false);
        return;
      }
      // Haal invitation op
      const { data: invitation, error: invitationError } = await supabase.from('invitations').select('*').eq('token', token).single();
      if (invitationError || !invitation) {
        setError('Uitnodiging niet gevonden of verlopen.');
        setLoading(false);
        return;
      }
      // Haal meeting op
      const { data: meetingData, error: meetingError } = await supabase.from('coffee_meetings').select('*').eq('id', invitation.meeting_id).single();
      if (meetingError || !meetingData) {
        setError('Afspraak niet gevonden.');
        setLoading(false);
        return;
      }
      setMeeting(meetingData);
      // Zet beschikbare tijden
      const times: {date: string, time: string}[] = [];
      (meetingData.dates || []).forEach((date: string) => {
        (meetingData.times || []).forEach((time: string) => {
          times.push({ date, time });
        });
      });
      setAvailableTimes(times);
      setFormData((prev) => ({ ...prev, email: invitation.email }));
      setLoading(false);
    };
    fetchData();
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Update invitation met gekozen tijd en status
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) return;
    const [selectedDate, selectedTime] = formData.selectedTime.split('-');
    await supabase.from('invitations').update({
      status: 'accepted',
      selected_date: selectedDate,
      selected_time: selectedTime,
    }).eq('token', token);
    navigate('/');
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto text-center py-12">Loading...</div>;
  }
  if (error) {
    return <div className="max-w-2xl mx-auto text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-primary-600 mb-2">
        {t('respond.title')}
      </h1>
      <p className="text-gray-600 mb-8">
        {t('respond.subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Available Times
          </label>
          <div className="space-y-3">
            {availableTimes.map((time, idx) => (
              <label key={idx} className="flex items-center">
                <input
                  type="radio"
                  name="selectedTime"
                  value={`${time.date}-${time.time}`}
                  checked={formData.selectedTime === `${time.date}-${time.time}`}
                  onChange={(e) => setFormData(prev => ({ ...prev, selectedTime: e.target.value }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-gray-700">
                  {new Date(time.date).toLocaleDateString()} - {t(`common.${time.time}`)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('common.email')}
          </label>
          <input
            type="email"
            id="email"
            className="input-field mt-1"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
            disabled
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          {t('common.submit')}
        </button>
      </form>
    </div>
  );
};

export default Respond; 