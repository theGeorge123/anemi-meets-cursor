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
  const [cafe, setCafe] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [wantsUpdates, setWantsUpdates] = useState(false);

  const UPDATES_EMAIL_KEY = 'anemi-updates-email';

  const callSendMeetingConfirmation = async (token: string) => {
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-meeting-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
    } catch (e) {
      console.error('Kon bevestigingsmail niet versturen:', e);
    }
  };

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
      // Haal cafe op
      if (meetingData.cafe_id) {
        const { data: cafeData } = await supabase.from('cafes').select('*').eq('id', meetingData.cafe_id).single();
        setCafe(cafeData);
      }
      // Zet beschikbare tijden
      let times: {date: string, time: string}[] = [];
      if (meetingData.date_time_options && Array.isArray(meetingData.date_time_options)) {
        meetingData.date_time_options.forEach((opt: {date: string, times: string[]}) => {
          (opt.times || []).forEach((time: string) => {
            times.push({ date: opt.date, time });
          });
        });
      }
      setAvailableTimes(times);
      setFormData((prev) => ({ ...prev, email: "" }));
      setLoading(false);
    };
    fetchData();
    // Check login status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user);
    });
    // Prefill email if saved
    const savedEmail = localStorage.getItem(UPDATES_EMAIL_KEY);
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setWantsUpdates(true);
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error state
    // Sla email op als updates gewenst
    if (wantsUpdates) {
      localStorage.setItem(UPDATES_EMAIL_KEY, formData.email);
    } else {
      localStorage.removeItem(UPDATES_EMAIL_KEY);
    }
    // Update invitation met gekozen tijd en status
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) {
      setError(t('respond.errorNoToken') || 'Geen geldige uitnodiging gevonden.');
      return;
    }
    if (!formData.selectedTime) {
      setError(t('respond.errorNoTime') || 'Kies een tijd.');
      return;
    }
    if (!formData.email) {
      setError(t('respond.errorNoEmail') || 'Vul je e-mailadres in.');
      return;
    }
    const [selectedDate, selectedTime] = formData.selectedTime.split('-');
    const { error: updateError } = await supabase.from('invitations').update({
      status: 'accepted',
      selected_date: selectedDate,
      selected_time: selectedTime,
      email: formData.email,
    }).eq('token', token);
    if (updateError) {
      setError(t('respond.errorUpdateInvite') || 'Kon uitnodiging niet bijwerken.');
      return;
    }
    // Fetch invitation to get meeting_id
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();
    if (invitationError || !invitation) {
      setError(t('respond.errorFetchInvite') || 'Uitnodiging niet gevonden.');
      return;
    }
    if (invitation && invitation.meeting_id) {
      const { error: meetingError } = await supabase
        .from('coffee_meetings')
        .update({ status: 'confirmed' })
        .eq('id', invitation.meeting_id);
      if (meetingError) {
        setError(t('respond.errorUpdateMeeting') || 'Kon afspraak niet bijwerken.');
        return;
      }
    } else {
      setError(t('respond.errorNoMeeting') || 'Geen geldige afspraak gevonden.');
      return;
    }
    // Debug: log token
    console.log('Token voor edge function:', token);
    if (token) {
      try {
        await callSendMeetingConfirmation(token);
      } catch (e) {
        setError(t('respond.errorSendMail') || 'Kon bevestigingsmail niet versturen.');
        return;
      }
    }
    navigate('/confirmed');
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto text-center py-12">Loading...</div>;
  }
  if (error) {
    return <div className="max-w-2xl mx-auto text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {cafe && (
        <div className="card bg-primary-50 mb-6">
          <h2 className="text-xl font-semibold text-primary-600">Café</h2>
          <p className="text-gray-700 font-medium">{cafe.name}</p>
          <p className="text-gray-500">{cafe.address}</p>
        </div>
      )}
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
          />
        </div>

        <div className="flex items-center">
          <input
            id="updates"
            type="checkbox"
            checked={wantsUpdates}
            onChange={() => setWantsUpdates(v => !v)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="updates" className="ml-2 text-gray-700">
            Wil je updates ontvangen?
          </label>
        </div>

        <button type="submit" className="btn-primary w-full">
          {t('common.submit')}
        </button>
      </form>
      {!isLoggedIn && (
        <div className="mt-8 text-center">
          <p className="mb-2 text-gray-600">Wil je zelf ook een meeting aanmaken?</p>
          <a href="/login" className="btn-secondary">Log in</a>
        </div>
      )}
    </div>
  );
};

export default Respond; 