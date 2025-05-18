import { useState, useEffect, forwardRef, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { supabase } from '../supabaseClient';
import "react-datepicker/dist/react-datepicker.css";
import { nl } from 'date-fns/locale';

interface City { id: string; name: string; }
interface Cafe { id: string; name: string; address: string; description?: string; image_url?: string; }

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
  const [userId, setUserId] = useState<string | null>(null);
  const [dateTimeOptions, setDateTimeOptions] = useState<{ date: string; times: string[] }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [shuffleCooldown, setShuffleCooldown] = useState(false);
  const shuffleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [step, setStep] = useState(2);

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
    // Extra check op verplichte velden
    if (!formData.name || !formData.email || !formData.city || formData.dates.length === 0 || !selectedCafe || !dateTimeOptions.some(opt => opt.times.length > 0)) {
      setFormError('Niet alle velden zijn ingevuld.');
      return;
    }
    if (!selectedCafe) return;
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
    // Controle: minimaal één tijd geselecteerd voor een van de datums
    const hasAnyTime = dateTimeOptions.some(opt => opt.times.length > 0);
    if (!hasAnyTime) {
      setFormError(t('common.requiredTime'));
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
    const res = await fetch("https://bijyercgpgaheeoeumtv.supabase.co/rest/v1/invitations", {
      method: "POST",
      headers: {
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        token,
        email_a: formData.email,
        selected_date,
        selected_time,
        cafe_id: selectedCafe.id,
        status: "pending",
        date_time_options: filteredDateTimeOptions
      })
    });
    const data = await res.json();
    if (!res.ok || !data || !data[0]) {
      alert(t('common.errorCreatingInvite'));
      return;
    }
    // 2. Token opslaan voor Invite-pagina
    sessionStorage.setItem('inviteToken', data[0].token);
    sessionStorage.setItem('invitationId', data[0].id);
    navigate('/invite');
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
    setSelectedCafe(null);
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

  // Automatische progressie
  useEffect(() => {
    if (step === 2 && formData.city) setStep(3);
    if (step === 3 && formData.dates.length > 0) setStep(4);
    if (step === 4 && dateTimeOptions.some(opt => opt.times.length > 0)) setStep(5);
  }, [step, formData.city, formData.dates, dateTimeOptions]);

  // Stap-indicator
  const steps = [
    'Jij',
    'Stad',
    'Datum',
    'Tijd',
    'Café',
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stap-indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {steps.map((label, idx) => (
          <div
            key={label}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
              ${step === idx + 1 ? 'bg-[#ff914d] text-white scale-110 shadow-lg' : 'bg-[#b2dfdb] text-primary-700 opacity-60'}`}
          >
            {idx + 1}
          </div>
        ))}
      </div>
      <h1 className="text-3xl font-bold text-primary-600 mb-2">
        <span role="img" aria-label="connect">🤝</span> Versterk de connectie
      </h1>
      <p className="text-gray-600 mb-8 text-lg">
        Vul hieronder alle details in en <span role="img" aria-label="rocket">🚀</span> met één druk op de knop ben je een stap dichterbij écht herconnecten op een bijzondere manier.<br/>
        Geen appjes, geen gedoe – gewoon samen afspreken <span role="img" aria-label="coffee">☕️</span> en ondertussen steun je ook nog de leukste lokale plekjes <span role="img" aria-label="cafe">🏠</span>!
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stap 2: Stad */}
        {step === 2 && (
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              <span role="img" aria-label="city">🏙️</span> Welke lokale stadstentjes wil je bezoeken? Wij regelen de juiste plek!
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
          </div>
        )}
        {/* Stap 3: Datum */}
        {step === 3 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span role="img" aria-label="calendar">📅</span> Kies de 3 datums die voor jou het best uitkomen voor een connectie!
            </label>
            <DatePicker
              inline
              minDate={new Date()}
              maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
              highlightDates={formData.dates}
              onChange={handleDatePickerChange}
              customInput={<CustomInput />}
              calendarClassName="anemi-datepicker"
              locale={nl}
            />
            {formData.dates.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {formData.dates.map((d) => {
                  const dateStr = getLocalDateString(d);
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
        )}
        {/* Stap 4: Tijdvakken */}
        {step === 4 && dateTimeOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.time')}</label>
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
                          disabled={isTimeSlotPast(opt.date, time)}
                        />
                        <span className="ml-2 text-gray-700">
                          {t(`common.${time}`)}
                          {isTimeSlotPast(opt.date, time) && (
                            <span className="ml-1 text-xs text-gray-400">(verlopen)</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Stap 5: Café + shuffle + bevestigen */}
        {step === 5 && selectedCafe && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-primary-600 mb-3 flex items-center gap-2 w-full max-w-md mx-auto">
              Jouw plekje <span role="img" aria-label="coffee">☕️</span>
            </h3>
            {selectedCafe.image_url && (
              <img
                src={selectedCafe.image_url}
                alt={selectedCafe.name}
                className="w-full max-w-md mx-auto rounded-2xl shadow mb-3 object-cover"
                style={{ maxHeight: 180 }}
              />
            )}
            <div className="bg-white/80 rounded-2xl shadow-md p-4 flex flex-col gap-1 border border-[#b2dfdb]/40 max-w-md mx-auto items-start">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">☕️</span>
                <span className="font-semibold text-primary-700 text-lg">{selectedCafe.name}</span>
              </div>
              <span className="text-gray-500 text-sm mb-2">{selectedCafe.address}</span>
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
          </div>
        )}
        {/* Foutmelding */}
        {formError && (
          <div className="text-red-500 text-sm">{formError}</div>
        )}
        {/* Navigatieknoppen */}
        <div className="flex gap-4 mt-8">
          {step > 2 && step <= 5 && (
            <button type="button" className="btn-secondary flex-1" onClick={() => setStep(step - 1)}>
              Vorige
            </button>
          )}
          {step === 5 && (
            <button type="submit" className="btn-primary flex-1">
              {t('common.continue')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateMeetup; 