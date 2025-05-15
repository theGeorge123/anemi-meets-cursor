import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { supabase } from '../supabaseClient';
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from 'uuid';

interface City { id: string; name: string; }
interface Cafe { id: string; name: string; address: string; description?: string; }

const CreateMeetup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dates: [] as Date[],
    timePreference: '',
    city: '',
  });
  const [cities, setCities] = useState<City[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [emailDisabled, setEmailDisabled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [dateTimeOptions, setDateTimeOptions] = useState<{ date: string; times: string[] }[]>([]);

  // Fetch cities (only Rotterdam)
  useEffect(() => {
    const fetchCities = async () => {
      const { data } = await supabase.from('cities').select('*').eq('name', 'Rotterdam');
      if (data) setCities(data);
    };
    fetchCities();
  }, []);

  // Fetch cafes for selected city
  useEffect(() => {
    const fetchCafes = async () => {
      if (!formData.city) return setCafes([]);
      const { data } = await supabase.from('cafes').select('*').eq('city', formData.city);
      if (data) setCafes(data);
    };
    fetchCafes();
  }, [formData.city]);

  useEffect(() => {
    // Prefill email with logged-in user's email
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user && session.user.email) {
        setFormData((prev) => ({ ...prev, email: session.user.email! }));
        setEmailDisabled(true);
        setUserId(session.user.id);
      }
    };
    getUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafe) return;
    if (!userId) {
      alert('Niet ingelogd. Log in om een afspraak te maken.');
      return;
    }
    // 1. Coffee meeting aanmaken
    const { data: meeting, error: meetingError } = await supabase.from('coffee_meetings').insert([
      {
        creator_id: userId,
        invitee_name: formData.name,
        invitee_email: formData.email,
        city_id: cities.find(c => c.name === formData.city)?.id,
        cafe_id: selectedCafe.id,
        status: 'pending',
        date_time_options: dateTimeOptions,
      }
    ]).select().single();
    if (meetingError || !meeting) {
      alert('Er ging iets mis bij het aanmaken van de afspraak: ' + (meetingError?.message || JSON.stringify(meetingError) || 'onbekende fout'));
      return;
    }
    // 2. Invitation aanmaken
    const token = uuidv4();
    const { data: invitation, error: invitationError } = await supabase.from('invitations').insert([
      {
        meeting_id: meeting.id,
        email: formData.email,
        token,
        status: 'pending',
      }
    ]).select().single();
    if (invitationError || !invitation) {
      alert('Er ging iets mis bij het aanmaken van de uitnodiging.');
      return;
    }
    // 3. Token opslaan voor Invite-pagina
    sessionStorage.setItem('inviteToken', token);
    sessionStorage.setItem('meetingId', meeting.id);
    navigate('/invite');
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
    setSelectedCafe(null);
  };

  const shuffleCafe = () => {
    if (cafes.length <= 1) return;
    let newCafe = selectedCafe;
    while (newCafe === selectedCafe) {
      newCafe = cafes[Math.floor(Math.random() * cafes.length)];
    }
    setSelectedCafe(newCafe);
  };

  // Pick a random cafe when cafes are loaded or city changes
  useEffect(() => {
    if (cafes.length > 0) {
      setSelectedCafe(cafes[Math.floor(Math.random() * cafes.length)]);
    } else {
      setSelectedCafe(null);
    }
  }, [cafes]);

  // DatePicker onChange aanpassen
  const handleDatesChange = (dates: Date[]) => {
    setFormData(prev => ({ ...prev, dates }));
    // Sync dateTimeOptions met nieuwe datums
    setDateTimeOptions((prevOptions) => {
      const newDates = dates.map(d => d.toISOString().split('T')[0]);
      // Voeg nieuwe datums toe
      let updated = [...prevOptions];
      newDates.forEach(date => {
        if (!updated.find(opt => opt.date === date)) {
          updated.push({ date, times: [] });
        }
      });
      // Verwijder datums die niet meer geselecteerd zijn
      updated = updated.filter(opt => newDates.includes(opt.date));
      return updated;
    });
  };

  // Tijdvak checkbox toggle
  const handleTimeToggle = (date: string, time: string) => {
    setDateTimeOptions(prev => prev.map(opt =>
      opt.date === date
        ? { ...opt, times: opt.times.includes(time) ? opt.times.filter(t => t !== time) : [...opt.times, time] }
        : opt
    ));
  };

  // Datum verwijderen
  const handleRemoveDate = (dateStr: string) => {
    setFormData(prev => ({
      ...prev,
      dates: prev.dates.filter(d => d.toISOString().split('T')[0] !== dateStr)
    }));
    setDateTimeOptions(prev => prev.filter(opt => opt.date !== dateStr));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-primary-600 mb-2">
        {t('createMeetup.title')}
      </h1>
      <p className="text-gray-600 mb-8">
        {t('createMeetup.subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {t('common.name')}
          </label>
          <input
            type="text"
            id="name"
            className="input-field mt-1"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
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
            disabled={emailDisabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('common.date')}
          </label>
          <DatePicker
            selected={formData.dates[0]}
            onChange={handleDatesChange}
            selectsMultiple
            inline
            minDate={new Date()}
            maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
            className="mt-1"
          />
          {formData.dates.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {formData.dates.map((d) => {
                const dateStr = d.toISOString().split('T')[0];
                return (
                  <span key={dateStr} className="inline-flex items-center bg-primary-100 text-primary-700 rounded-full px-3 py-1 text-sm font-medium">
                    {new Date(dateStr).toLocaleDateString()}
                    <button
                      type="button"
                      onClick={() => handleRemoveDate(dateStr)}
                      className="ml-2 text-primary-500 hover:text-red-500 focus:outline-none"
                      aria-label="Verwijder datum"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {dateTimeOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kies tijden per datum</label>
            <div className="space-y-4">
              {dateTimeOptions.map(opt => (
                <div key={opt.date} className="border rounded-lg p-3 bg-primary-50">
                  <div className="font-medium text-primary-600 mb-2">{new Date(opt.date).toLocaleDateString()}</div>
                  <div className="flex gap-6">
                    {['morning', 'afternoon', 'evening'].map(time => (
                      <label key={time} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={opt.times.includes(time)}
                          onChange={() => handleTimeToggle(opt.date, time)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-gray-700">{t(`common.${time}`)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            {t('common.city')}
          </label>
          <select
            id="city"
            className="input-field mt-1"
            value={formData.city}
            onChange={(e) => handleCityChange(e.target.value)}
            required
          >
            <option value="">Selecteer een stad</option>
            {cities.map((city) => (
              <option key={city.id} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCafe && (
          <div className="card bg-primary-50">
            <h3 className="text-lg font-medium text-primary-600">
              Suggested Cafe
            </h3>
            <p className="text-gray-700">{selectedCafe.name}</p>
            <p className="text-gray-500">{selectedCafe.address}</p>
            {cafes.length > 1 && (
              <button
                type="button"
                className="btn-secondary mt-2"
                onClick={shuffleCafe}
              >
                Shuffle Cafe
              </button>
            )}
          </div>
        )}

        <button type="submit" className="btn-primary w-full">
          {t('common.continue')}
        </button>
      </form>
    </div>
  );
};

export default CreateMeetup; 