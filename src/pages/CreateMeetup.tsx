import { useState, useEffect, forwardRef, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { supabase } from '../supabaseClient';
import "react-datepicker/dist/react-datepicker.css";
import { nl, enUS } from 'date-fns/locale';
import Confetti from 'react-confetti';

interface City { id: string; name: string; }
interface Cafe { id: string; name: string; address: string; description?: string; image_url?: string; }

const CreateMeetup = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    dates: [] as Date[],
    timePreference: '',
    city: '',
  });
  const [cities, setCities] = useState<City[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [dateTimeOptions, setDateTimeOptions] = useState<{ date: string; times: string[] }[]>([]);
  const [shuffleCooldown, setShuffleCooldown] = useState(false);
  const shuffleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [step, setStep] = useState(1);
  const dateLocale = i18n.language === 'en' ? enUS : nl;
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

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
    // Scroll naar boven bij laden
    window.scrollTo(0, 0);
  }, []);

  // Prefill name if logged in (prefer user_metadata, fallback to profiles)
  useEffect(() => {
    const fetchProfileName = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const metaName = session.user.user_metadata?.full_name;
        if (metaName && !formData.name) {
          setFormData(prev => ({ ...prev, name: metaName }));
          return;
        }
        // Fallback: try profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .single();
        if (profile && profile.full_name && !formData.name) {
          setFormData(prev => ({ ...prev, name: profile.full_name }));
        }
      }
    };
    fetchProfileName();
  }, []);

  // Update window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validatie
    if (formData.dates.length === 0) {
      alert(t('common.requiredTime'));
      return;
    }
    const hasAnyTime = dateTimeOptions.some(opt => opt.times.length > 0);
    if (!hasAnyTime) {
      alert(t('common.requiredTime'));
      return;
    }
    if (!formData.name || !formData.city || !selectedCafe) {
      alert(t('common.errorCreatingInvite'));
      return;
    }

    // Filter tijdvakken
    const validTimes = ['morning', 'afternoon', 'evening'];
    const filteredDateTimeOptions = dateTimeOptions
      .map(opt => ({
        date: opt.date,
        times: (opt.times || []).filter(time => validTimes.includes(time))
      }))
      .filter(opt => opt.times.length > 0);

    const firstDateOpt = filteredDateTimeOptions.find(opt => opt.times.length > 0);
    if (!firstDateOpt) {
      alert(t('common.requiredTime'));
      return;
    }

    const selected_date = firstDateOpt.date;
    const selected_time = firstDateOpt.times[0];
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

    const payload = {
      token,
      invitee_name: formData.name,
      status: "pending",
      selected_date,
      selected_time,
      cafe_id: selectedCafe.id,
      date_time_options: filteredDateTimeOptions
    };

    try {
      const { data: insertData, error: insertError } = await supabase
        .from('invitations')
        .insert(payload)
        .select();
      if (insertError || !insertData || insertData.length === 0) {
        alert(insertError?.message || 'Er ging iets mis bij het aanmaken van de uitnodiging.');
        return;
      }
      const createdInvite = insertData[0];
      const responseToken = createdInvite.token;
      if (responseToken) {
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          navigate(`/invite/${responseToken}`);
        }, 2000);
      }
    } catch (err) {
      alert('Er ging iets mis met de verbinding. Probeer het opnieuw.');
    }
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

  // Helper: bepaal of een tijdvak in het verleden ligt (alleen voor vandaag)
  const isTimeSlotPast = (dateStr: string, time: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    if (date.toDateString() !== today.toDateString()) return false;
    
    const now = new Date();
    const timeMap = {
      morning: 12, // voor 12:00
      afternoon: 17, // voor 17:00
      evening: 22 // voor 22:00
    };
    return now.getHours() >= timeMap[time as keyof typeof timeMap];
  };

  // Helper: check of er geldige datum/tijd selecties zijn
  const hasValidDateTimeSelection = () => {
    return formData.dates.length > 0 && dateTimeOptions.some(opt => opt.times.length > 0);
  };

  // Custom input voor DatePicker (verbergt standaard input)
  const CustomInput = forwardRef<HTMLInputElement>((props, ref) => (
    <input type="text" style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, opacity: 0 }} ref={ref} {...props} />
  ));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary-600 mb-4">
        {t('createMeetup.title')}
      </h1>
      <p className="text-gray-700 mb-8 text-lg">
        {t('createMeetup.subtitle')}
      </p>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              1
            </div>
            <span className="ml-2 font-medium">{t('createMeetup.step1')}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
            <span className="ml-2 font-medium">{t('createMeetup.step2')}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              3
            </div>
            <span className="ml-2 font-medium">{t('createMeetup.step3')}</span>
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="card bg-primary-50 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold text-primary-700 mb-4">
            {t('createMeetup.chooseCityInfo')}
          </h2>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">
              {t('common.name')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
              placeholder={t('common.name')}
            />
            <label className="block text-gray-700 mb-2">
              {t('createMeetup.chooseCityLabel')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleCityChange(city.name)}
                  className={`p-4 rounded-xl border-2 transition-all duration-150 font-semibold text-lg shadow-sm flex items-center justify-center
                    ${formData.city === city.name ? 'border-primary-600 bg-primary-100 text-primary-800 scale-105 ring-2 ring-primary-300' : 'border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50'}`}
                  aria-pressed={formData.city === city.name}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!formData.city || !formData.name}
            className="btn-primary w-full py-3 px-6 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {t('common.continue')}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.date')}
            </label>
            <div className="relative">
              <DatePicker
                selected={null}
                onChange={handleDatePickerChange}
                locale={dateLocale}
                inline
                minDate={new Date()}
                customInput={<CustomInput />}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{t('createMeetup.chooseDaysInfo')}</p>
          </div>

          {formData.dates.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">{t('common.selectedDates')}</h3>
              {formData.dates.map((date, idx) => {
                const dateStr = getLocalDateString(date);
                const dateOpt = dateTimeOptions.find(opt => opt.date === dateStr);
                return (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">{date.toLocaleDateString()}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(dateStr)}
                        className="text-red-500 hover:text-red-700"
                      >
                        {t('common.remove')}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {['morning', 'afternoon', 'evening'].map(time => (
                        <label key={time} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={dateOpt?.times.includes(time) || false}
                            onChange={() => handleTimeToggle(dateStr, time)}
                            disabled={isTimeSlotPast(dateStr, time)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                          />
                          <span className={`ml-2 ${isTimeSlotPast(dateStr, time) ? 'text-gray-400' : 'text-gray-700'}`}>
                            {t(`common.${time}`)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary flex-1"
            >
              {t('common.back')}
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="btn-primary flex-1"
              disabled={!hasValidDateTimeSelection()}
            >
              {t('common.continue')}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-primary-50 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-primary-700 mb-4">
              {t('createMeetup.chooseCityLabel')}
            </h2>
            
            {selectedCafe && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
                {selectedCafe.image_url && (
                  <img
                    src={selectedCafe.image_url}
                    alt={selectedCafe.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{selectedCafe.name}</h3>
                  <p className="text-gray-600 mb-2">{selectedCafe.address}</p>
                  {selectedCafe.description && (
                    <p className="text-gray-500 text-sm">{selectedCafe.description}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={shuffleCafe}
                disabled={shuffleCooldown || cafes.length <= 1}
                className="btn-secondary flex-1"
              >
                {t('common.shuffle')}
              </button>
              <button
                onClick={handleSubmit}
                className="btn-primary flex-1"
                disabled={!selectedCafe || !hasValidDateTimeSelection()}
              >
                {t('common.submit')}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-secondary flex-1"
            >
              {t('common.back')}
            </button>
          </div>
        </div>
      )}

      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={300}
            gravity={0.2}
            initialVelocityY={10}
            tweenDuration={2000}
          />
        </div>
      )}
    </div>
  );
};

export default CreateMeetup; 