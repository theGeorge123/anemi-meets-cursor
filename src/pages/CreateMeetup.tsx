import { useState, useEffect, forwardRef, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { supabase } from '../supabaseClient';
import "react-datepicker/dist/react-datepicker.css";
import { nl, enUS } from 'date-fns/locale';

interface City { id: string; name: string; }
interface Cafe { id: string; name: string; address: string; description?: string; image_url?: string; }

const CreateMeetup = () => {
  const { t, i18n } = useTranslation();
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
  const [userId, setUserId] = useState<string | null>(null);
  const [dateTimeOptions, setDateTimeOptions] = useState<{ date: string; times: string[] }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [shuffleCooldown, setShuffleCooldown] = useState(false);
  const shuffleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [step, setStep] = useState(2);
  const dateLocale = i18n.language === 'en' ? enUS : nl;

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
    // Prefill email and name with logged-in user's info
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user && session.user.email) {
        let userName = '';
        // Try to get name from profile
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', session.user.id).single();
        if (profile && profile.name && profile.name.trim() !== '') {
          userName = profile.name;
        } else {
          // Fallback: use email prefix
          userName = '';
        }
        setFormData((prev) => ({ ...prev, email: session.user.email!, name: userName }));
        setUserId(session.user.id);
      }
    };
    getUser();
    // Scroll naar boven bij laden
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    // Nieuwe validatie: minimaal één datum én één tijdvak
    if (formData.dates.length === 0) {
      setFormError(t('common.requiredTime'));
      return;
    }
    const hasAnyTime = dateTimeOptions.some(opt => opt.times.length > 0);
    if (!hasAnyTime) {
      setFormError(t('common.requiredTime'));
      return;
    }
    if (!formData.name || !formData.email || !formData.city || !selectedCafe) {
      setFormError(t('common.errorCreatingInvite'));
      return;
    }
    if (!userId) {
      alert(t('common.notLoggedIn'));
      return;
    }
    // Check of profiel bestaat, zo niet: aanmaken (met upsert)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      email: formData.email,
    });
    if (profileError) {
      setFormError('Kon profiel niet aanmaken: ' + profileError.message);
      return;
    }
    // Filter alleen geldige tijdvakken
    const validTimes = ['morning', 'afternoon', 'evening'];
    const filteredDateTimeOptions = dateTimeOptions
      .map(opt => ({
        date: opt.date,
        times: (opt.times || []).filter(time => validTimes.includes(time))
      }))
      .filter(opt => opt.times.length > 0);
    // Extract the first selected date and time
    const firstDateOpt = filteredDateTimeOptions.find(opt => opt.times.length > 0);
    if (!firstDateOpt) {
      setFormError(t('common.requiredTime'));
      return;
    }
    const selected_date = firstDateOpt.date;
    const selected_time = firstDateOpt.times[0];
    // 1. Invitation aanmaken via Supabase REST API
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    const payload = {
      token,
      email_a: formData.email,
      status: "pending",
      selected_date,
      selected_time,
      cafe_id: selectedCafe.id,
      city_id: cities.find(c => c.name === formData.city)?.id,
      date_time_options: filteredDateTimeOptions
    };
    console.log('Payload for invitation:', payload);
    // HARDCODED API KEY for guaranteed invite creation
    const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!apiKey) {
      throw new Error('Supabase API key is missing! Check your .env and restart the dev server.');
    }
    console.log('SUPABASE APIKEY (hardcoded):', apiKey);
    const res = await fetch("https://bijyercgpgaheeoeumtv.supabase.co/rest/v1/invitations", {
      method: "POST",
      headers: {
        "apikey": apiKey,
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Supabase response:', res.status, data);
    if (!res.ok || !data || !data[0]) {
      alert(t('common.errorCreatingInvite'));
      return;
    }
    // 2. Token opslaan voor Invite-pagina + extra info voor edge function
    sessionStorage.setItem('inviteToken', data[0].token);
    sessionStorage.setItem('invitationId', data[0].id);
    sessionStorage.setItem('inviteEmailA', formData.email);
    sessionStorage.setItem('inviteCafeId', selectedCafe.id);
    sessionStorage.setItem('inviteDateTimeOptions', JSON.stringify(filteredDateTimeOptions));
    navigate('/invite');
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
    // Zoek cafés voor deze stad en selecteer er direct één (random)
    supabase.from('cafes').select('*').eq('city', city).then(({ data }) => {
      if (data && data.length > 0) {
        setCafes(data);
        setSelectedCafe(data[Math.floor(Math.random() * data.length)]);
      } else {
        setCafes([]);
        setSelectedCafe(null);
      }
    });
  };

  const shuffleCafe = () => {
    if (shuffleCooldown || cafes.length <= 1) return;
    let newCafe = selectedCafe;
    while (newCafe === selectedCafe) {
      newCafe = cafes[Math.floor(Math.random() * cafes.length)];
    }
    setSelectedCafe(newCafe);
    setShuffleCooldown(true);
    if (shuffleTimeoutRef.current) clearTimeout(shuffleTimeoutRef.current);
    shuffleTimeoutRef.current = setTimeout(() => setShuffleCooldown(false), 1000);
  };

  // Pick a random cafe when cafes are loaded or city changes
  useEffect(() => {
    if (cafes.length > 0) {
      setSelectedCafe(cafes[Math.floor(Math.random() * cafes.length)]);
    } else {
      setSelectedCafe(null);
    }
  }, [cafes]);

  // Helper: get local date string in YYYY-MM-DD
  const getLocalDateString = (date: Date) => {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  };

  // Multi-date select: toggle datum bij klik
  const handleDatePickerChange = (date: Date) => {
    const dateStr = getLocalDateString(date);
    const exists = formData.dates.some(d => getLocalDateString(d) === dateStr);
    if (exists) {
      handleRemoveDate(dateStr);
    } else {
      setFormData(prev => ({ ...prev, dates: [...prev.dates, date] }));
      setDateTimeOptions(prev => ([...prev, { date: dateStr, times: [] }]));
    }
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
      dates: prev.dates.filter(d => getLocalDateString(d) !== dateStr)
    }));
    setDateTimeOptions(prev => prev.filter(opt => opt.date !== dateStr));
  };

  // Custom input voor DatePicker (verbergt standaard input)
  const CustomInput = forwardRef<HTMLInputElement>((props, ref) => (
    <input type="text" style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, opacity: 0 }} ref={ref} {...props} />
  ));

  // Helper: bepaal of een tijdvak in het verleden ligt (alleen voor vandaag)
  const isTimeSlotPast = (dateStr: string, time: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    if (date.toDateString() !== today.toDateString()) return false;
    const now = today.getHours();
    if (time === 'morning' && now >= 12) return true;
    if (time === 'afternoon' && now >= 18) return true;
    if (time === 'evening' && now >= 22) return true;
    return false;
  };

  // Stap-indicator
  const steps = [
    'Stad',
    'Datum & Tijd',
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Gratis plannen uitleg */}
      <div className="bg-[#fff7f3] rounded-xl p-4 mb-4 text-center shadow text-primary-700 font-medium text-base">
        {t('common.freeMeetupInfo')}
      </div>
      {/* Stap-indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {steps.map((label, idx) => (
          <div
            key={label}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
              ${step === idx + 2 ? 'bg-[#ff914d] text-white scale-110 shadow-lg' : 'bg-[#b2dfdb] text-primary-700 opacity-60'}`}
          >
            {idx + 1}
          </div>
        ))}
      </div>
      <h1 className="text-3xl font-bold text-primary-600 mb-2">
        <span role="img" aria-label="connect">🤝</span> Versterk de connectie
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stap 2: Stad */}
        {step === 2 && (
          <>
            {/* Welkomstbericht alleen bij eerste stap */}
            <div className="mb-6 bg-white/80 rounded-xl shadow p-4 text-center text-primary-700 font-semibold text-lg">
              {t('common.welcomeTitle')}{formData.name && formData.name.trim() !== '' ? `, ${formData.name}` : ''}!<br />
              {t('common.welcomeLine1')}<br />
              {t('common.welcomeLine2')}
            </div>
            <div>
              <div className="mb-3 text-primary-700 text-base font-medium bg-[#fff7f3] rounded-xl p-3 shadow-sm">
                <span className="text-lg">🏙️</span> {t('createMeetup.chooseCityInfo')}
              </div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                <span role="img" aria-label="city">🏙️</span> {t('createMeetup.chooseCityLabel')}
              </label>
              <div className="relative">
                <select
                  id="city"
                  className="city-select"
                  value={formData.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  required
                >
                  <option value="">{t('common.selectCity')}</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Direct café tonen na stadkeuze */}
              {selectedCafe && (
                <div className="mt-6 bg-white/80 rounded-2xl shadow-md p-4 flex flex-col gap-1 border border-[#b2dfdb]/40 max-w-md mx-auto items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">☕️</span>
                    <span className="font-semibold text-primary-700 text-lg">{selectedCafe.name}</span>
                  </div>
                  <span className="text-gray-500 text-sm mb-2">{selectedCafe.address}</span>
                  {selectedCafe.image_url && (
                    <img
                      src={selectedCafe.image_url}
                      alt={selectedCafe.name}
                      className="w-full max-w-md mx-auto rounded-2xl shadow mb-3 object-cover"
                      style={{ maxHeight: 120 }}
                    />
                  )}
                  {cafes.length > 1 && (
                    <button
                      type="button"
                      className={`btn-secondary mt-2 transition-colors duration-200 ${shuffleCooldown ? 'opacity-60 cursor-not-allowed bg-gray-200 text-gray-400' : ''}`}
                      onClick={shuffleCafe}
                      disabled={shuffleCooldown}
                    >
                      {shuffleCooldown ? 'Even wachten...' : 'Shuffle café'}
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* Navigatieknoppen voor step 2 */}
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                className="btn-secondary flex-1 opacity-50 cursor-not-allowed"
                disabled
              >
                Vorige
              </button>
              <button
                type="button"
                className={`btn-primary flex-1 ${!formData.city ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => formData.city && setStep(3)}
                disabled={!formData.city}
              >
                Volgende
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <div>
            <div className="mb-3 text-primary-700 text-base font-medium bg-[#fff7f3] rounded-xl p-3 shadow-sm">
              <span className="text-lg">📅</span> {t('createMeetup.chooseDaysInfo')}
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span role="img" aria-label="calendar">📅</span> {t('createMeetup.chooseThreeDates')}
            </label>
            <DatePicker
              inline
              minDate={new Date()}
              maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
              highlightDates={formData.dates}
              onChange={handleDatePickerChange}
              customInput={<CustomInput />}
              calendarClassName="anemi-datepicker"
              locale={dateLocale}
            />
            {/* Direct tijdvakken per gekozen datum */}
            {dateTimeOptions.length > 0 && (
              <div className="mt-6 space-y-4">
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
                            disabled={isTimeSlotPast(opt.date, time)}
                          />
                          <span className="ml-2 text-gray-700">
                            {t(`common.${time}`)}
                            {isTimeSlotPast(opt.date, time) && (
                              <span className="ml-1 text-xs text-gray-400">{t('createMeetup.expired')}</span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Informele tekst altijd tonen */}
            <div className="mt-10 bg-white/80 rounded-2xl shadow-md p-5 border border-[#b2dfdb]/40 max-w-lg mx-auto text-center text-primary-700 font-semibold">
              {t('createMeetup.ctaGetInvite')}
            </div>
            {/* Navigatieknoppen voor stap 3: direct submitten */}
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setStep(2)}
              >
                Vorige
              </button>
              <button
                type="submit"
                className={`btn-primary flex-1 ${!(formData.dates.length > 0 && dateTimeOptions.some(opt => opt.times.length > 0)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!(formData.dates.length > 0 && dateTimeOptions.some(opt => opt.times.length > 0))}
              >
                {t('common.continue')}
              </button>
            </div>
          </div>
        )}
        {/* Foutmelding */}
        {formError && (
          <div className="text-red-500 text-sm">{formError}</div>
        )}
      </form>
    </div>
  );
};

export default CreateMeetup; 