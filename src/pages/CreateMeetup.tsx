import { useState, useEffect, forwardRef, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { supabase } from '../supabaseClient';
import "react-datepicker/dist/react-datepicker.css";
import { nl, enUS } from 'date-fns/locale';
import Confetti from 'react-confetti';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Toast from '../components/Toast';
import React from 'react';

interface City { id: string; name: string; }
interface Cafe { id: string; name: string; address: string; description?: string; image_url?: string; }

const TOTAL_STEPS = 5;

const getLastCity = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('lastCity') || '';
  }
  return '';
};

// Memoizeer tijdslotknop
const TimeSlotButton = React.memo(function TimeSlotButton({ time, isSelected, isPast, onClick, t }: { time: string, isSelected: boolean, isPast: boolean, onClick: () => void, t: any }) {
  return (
    <button
      key={time}
      type="button"
      onClick={onClick}
      disabled={isPast}
      className={`w-full p-3 rounded-xl border-2 font-semibold text-base shadow-sm flex flex-col items-center justify-center transition-all duration-150
        ${isSelected ? 'border-primary-600 bg-primary-100 text-primary-800 scale-105 ring-2 ring-primary-300' : 'border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50'}
        ${isPast ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-pressed={isSelected}
    >
      {t(`common.${time}`)}
    </button>
  );
});

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
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successSummary, setSuccessSummary] = useState<{date: string, time: string, cafe: string, token?: string} | null>(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [loadingCafes, setLoadingCafes] = useState(false);
  const [cafesError, setCafesError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMeetupToast, setShowMeetupToast] = useState(false);

  // 1. Extend Yup schema for all steps
  const fullSchema = yup.object().shape({
    name: yup.string().required(t('createMeetup.errorNameRequired')).min(2, t('createMeetup.errorNameShort')),
    email: yup.string()
      .email(t('createMeetup.errorEmailInvalid'))
      .test('required-if-no-user', t('createMeetup.errorEmailRequired'), function (value) {
        return !!user ? true : !!value;
      }),
    city: yup.string().required(t('createMeetup.errorCityRequired')),
    dates: yup.array().of(yup.date()).min(1, t('createMeetup.errorDatesRequired')),
    dateTimeOptions: yup.array().of(
      yup.object().shape({
        date: yup.string().required(),
        times: yup.array().of(yup.string()).min(1, t('createMeetup.errorTimesRequired')),
      })
    ).min(1, t('createMeetup.errorTimesRequired')),
    cafe: yup.object().nullable().required(t('createMeetup.errorCafeRequired')),
  });

  const { register, handleSubmit: rhfHandleSubmit, formState: { errors, isValid }, setValue, trigger } = useForm({
    mode: 'onChange',
    resolver: yupResolver(fullSchema),
    defaultValues: {
      name: formData.name,
      email: email,
    },
  });

  // 2. Add step validation logic
  const validateStep = async (currentStep: number) => {
    try {
      if (currentStep === 1) {
        await fullSchema.validateAt('name', { name: formData.name });
        if (!user) await fullSchema.validateAt('email', { email });
      } else if (currentStep === 2) {
        await fullSchema.validateAt('city', { city: formData.city });
      } else if (currentStep === 3) {
        await fullSchema.validateAt('dates', { dates: formData.dates });
        await fullSchema.validateAt('dateTimeOptions', { dateTimeOptions });
      } else if (currentStep === 4) {
        await fullSchema.validateAt('cafe', { cafe: selectedCafe });
      }
      setFormError(null);
      return true;
    } catch (err: any) {
      setFormError(err.message);
      return false;
    }
  };

  // 3. Update navigation to trigger validation
  const goToStep = async (nextStep: number) => {
    const valid = await validateStep(step);
    if (valid) setStep(nextStep);
  };

  // Fetch cities (only Rotterdam)
  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      setCitiesError(null);
      try {
        const { data, error } = await supabase.from('cities').select('*').eq('name', 'Rotterdam');
        if (error) throw error;
        if (data) setCities(data as City[]);
      } catch (err: any) {
        setCitiesError(t('createMeetup.errorCitiesFetch'));
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [t]);

  // Fetch cafes for selected city
  useEffect(() => {
    const fetchCafes = async () => {
      setLoadingCafes(true);
      setCafesError(null);
      if (!formData.city) {
        setCafes([]);
        setLoadingCafes(false);
        return;
      }
      try {
        const { data, error } = await supabase.from('cafes').select('*').eq('city', formData.city);
        if (error) throw error;
        if (data) setCafes(data as Cafe[]);
      } catch (err: any) {
        setCafesError(t('createMeetup.errorCafesFetch'));
      } finally {
        setLoadingCafes(false);
      }
    };
    fetchCafes();
  }, [formData.city, t]);

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
          setFormData(prev => {
            setTimeout(() => { trigger('name'); }, 0);
            return { ...prev, name: metaName };
          });
          return;
        }
        // Fallback: try profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .maybeSingle();
        if (!profileError && profile && profile.full_name && !formData.name) {
          setFormData(prev => {
            setTimeout(() => { trigger('name'); }, 0);
            return { ...prev, name: profile.full_name };
          });
        }
      }
    };
    fetchProfileName();
  }, [formData.name, trigger]);

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

  // Check if user is logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkSession();
  }, []);

  useEffect(() => {
    // Prefill stad uit localStorage
    const lastCity = getLastCity();
    if (lastCity && !formData.city) {
      setFormData(prev => ({ ...prev, city: lastCity }));
    }
  }, []);

  // Synchroniseer formData met react-hook-form
  useEffect(() => {
    setValue('name', formData.name);
    setValue('email', email);
  }, [formData.name, email, setValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    // Validatie
    if (formData.dates.length === 0) {
      setFormError(t('common.requiredTime'));
      return;
    }
    const hasAnyTime = dateTimeOptions.some(opt => opt.times.length > 0);
    if (!hasAnyTime) {
      setFormError(t('common.requiredTime'));
      return;
    }
    if (!formData.name || !formData.city || !selectedCafe) {
      setFormError(t('common.errorMissingFields', { fields: [!formData.name ? t('common.name') : '', !formData.city ? t('common.city') : '', !selectedCafe ? t('common.cafe') : ''].filter(Boolean).join(', ') }));
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
      setFormError(t('common.requiredTime'));
      return;
    }

    const selected_date = firstDateOpt.date;
    const selected_time = firstDateOpt.times[0];
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

    const payload: any = {
      token,
      invitee_name: formData.name,
      status: "pending",
      selected_date,
      selected_time,
      cafe_id: selectedCafe.id,
      date_time_options: filteredDateTimeOptions
    };
    if (!user) {
      payload.email_b = email;
    }

    try {
      const { data: insertData, error: insertError } = await supabase
        .from('invitations')
        .insert(payload)
        .select();
      if (insertError || !insertData || insertData.length === 0) {
        let msg = t('common.errorCreatingInvite');
        if (insertError) {
          const code = insertError.code || '';
          switch (code) {
            case 'error_network':
              msg = t('common.errorNetwork');
              break;
            case 'validation_failed':
              msg = t('common.errorValidationFailed');
              break;
            default:
              const errMsg = insertError.message?.toLowerCase() || '';
              if (errMsg.includes('network')) {
                msg = t('common.errorNetwork');
              } else if (errMsg.includes('valid')) {
                msg = t('common.errorValidationFailed');
              }
          }
        }
        setFormError(msg);
        return;
      }
      // Succes: samenvatting tonen
      const inviteToken = (insertData && insertData[0] && insertData[0].token) || token;
      setSuccessSummary({
        date: selected_date,
        time: selected_time,
        cafe: selectedCafe?.name || '',
        token: inviteToken,
      });
      setShowSuccess(true);
      setShowConfetti(true);
      setShowMeetupToast(true);
      setTimeout(() => {
        setShowConfetti(false);
      }, 2000);
    } catch (err) {
      setFormError(t('common.errorNetwork'));
    }
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastCity', city);
    }
    // Zoek cafés voor deze stad en selecteer er direct één (random)
    supabase.from('cafes').select('*').eq('city', city).then(({ data }) => {
      if (data && data.length > 0) {
        setCafes(data as Cafe[]);
        setSelectedCafe((data as Cafe[])[Math.floor(Math.random() * data.length)]);
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
  const handleTimeToggle = useCallback((dateStr: string, time: string) => {
    setDateTimeOptions(prev => prev.map(opt =>
      opt.date === dateStr
        ? { ...opt, times: opt.times.includes(time) ? opt.times.filter(t => t !== time) : [...opt.times, time] }
        : opt
    ));
  }, []);

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

  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      const content = viewport.getAttribute('content');
      if (content && !content.includes('maximum-scale')) {
        viewport.setAttribute('content', content + ', maximum-scale=1.0');
      }
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold text-primary-600 mb-8">
        {t('createMeetup.title')}
      </h1>
      <p className="text-gray-700 mb-8 text-lg">
        {t('createMeetup.subtitle')}
      </p>
      {/* Voortgangsindicatie */}
      <div className="mb-8 flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        <div className="flex gap-2 items-center">
          {[1,2,3,4,5].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex flex-col items-center mx-1`}>
                <div className={`w-7 h-7 flex items-center justify-center rounded-full font-bold text-base border-2 ${step === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-primary-100 text-primary-700 border-primary-200'}`}>{s}</div>
                <span className={`text-xs mt-1 ${step === s ? 'text-primary-700 font-semibold' : 'text-gray-400'}`}>{[
                  'Who are you?',
                  'Pick a city',
                  'Pick dates',
                  'Pick a café',
                  'Summary',
                ][i]}</span>
              </div>
              {i < 4 && <div className="w-6 h-1 bg-primary-200 rounded-full mx-1" />}
            </React.Fragment>
          ))}
        </div>
      </div>
      {/* Stap 1: Contactpersoon */}
      {step === 1 && (
        <form className="card bg-primary-50 p-6 rounded-xl shadow-md" onSubmit={rhfHandleSubmit(() => goToStep(2))} autoComplete="off">
          <h2 className="text-2xl font-bold text-primary-700 mb-6">Who are you meeting up as today?</h2>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="name">Your name or nickname <span className='italic'>(make it fun!)</span></label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={e => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                setValue('name', e.target.value);
                trigger('name');
              }}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-1 ${errors.name ? 'border-red-500' : formData.name ? 'border-green-500' : 'border-primary-200'}`}
              placeholder={t('common.name')}
              autoComplete="off"
            />
            {errors.name && <div className="text-red-500 text-sm mb-2">{errors.name.message}</div>}
          </div>
          {!user && (
            <div className="mb-2">
              <label className="block text-gray-700 mb-2" htmlFor="email">{t('common.email')}</label>
              <input
                id="email"
                type="email"
                {...register('email')}
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setValue('email', e.target.value);
                  trigger('email');
                }}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-1 ${errors.email ? 'border-red-500' : email ? 'border-green-500' : 'border-primary-200'}`}
                placeholder={t('common.email')}
                autoComplete="off"
                required
              />
              {errors.email && <div className="text-red-500 text-sm mb-2">{errors.email.message}</div>}
            </div>
          )}
          <button
            type="submit"
            disabled={!isValid}
            className="btn-primary w-full py-3 px-6 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {t('common.continue')}
          </button>
          {/* Suggesties */}
          {errors.name && <div className="text-xs text-gray-500 mt-1">{t('createMeetup.suggestionName')}</div>}
          {errors.email && <div className="text-xs text-gray-500 mt-1">{t('createMeetup.suggestionEmail')}</div>}
        </form>
      )}
      {/* Stap 2: Stad kiezen */}
      {step === 2 && (
        <div className="card bg-primary-50 p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('createMeetup.chooseCityLabel')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
          <div className="flex gap-4">
            <button type="button" onClick={() => goToStep(1)} className="btn-secondary flex-1">{t('common.back')}</button>
            <button type="button" onClick={() => goToStep(3)} className="btn-primary flex-1" disabled={!formData.city}>{t('common.continue')}</button>
          </div>
          {loadingCities && <div className="text-sm text-gray-500 mb-2">{t('createMeetup.loadingCities')}</div>}
          {citiesError && <div className="text-red-500 text-sm mb-2">{citiesError}</div>}
          <p className="text-sm text-gray-500 mb-4">{t('createMeetup.chooseCityInfo')}</p>
        </div>
      )}
      {/* Stap 3: Datum/tijd kiezen */}
      {step === 3 && (
        <div className="card bg-primary-50 p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('createMeetup.chooseDateTime')}</h2>
          <div className="mb-6">
            <DatePicker
              selected={null}
              onChange={handleDatePickerChange}
              locale={dateLocale}
              inline
              minDate={new Date()}
              customInput={<CustomInput />}
            />
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                      {['morning', 'afternoon', 'evening'].map(time => {
                        const isSelected = dateOpt?.times.includes(time) || false;
                        const isPast = isTimeSlotPast(dateStr, time);
                        return (
                          <TimeSlotButton
                            key={time}
                            time={time}
                            isSelected={isSelected}
                            isPast={isPast}
                            onClick={() => handleTimeToggle(dateStr, time)}
                            t={t}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {formData.dates.length === 0 && <div className="text-red-500 text-sm mb-2">{t('createMeetup.errorDatesRequired')}</div>}
          <div className="flex gap-4 mt-6">
            <button type="button" onClick={() => goToStep(2)} className="btn-secondary flex-1">{t('common.back')}</button>
            <button type="button" onClick={() => goToStep(4)} className="btn-primary flex-1" disabled={!hasValidDateTimeSelection()}>{t('common.continue')}</button>
          </div>
        </div>
      )}
      {/* Stap 4: Café kiezen */}
      {step === 4 && (
        <div className="card bg-primary-50 p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('createMeetup.chooseCafe')}</h2>
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
          <div className="flex gap-4 mb-4">
            <button type="button" onClick={shuffleCafe} disabled={shuffleCooldown || cafes.length <= 1} className="btn-secondary flex-1">{t('common.shuffle')}</button>
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => goToStep(3)} className="btn-secondary flex-1">{t('common.back')}</button>
            <button type="button" onClick={() => goToStep(5)} className="btn-primary flex-1" disabled={!selectedCafe}>{t('common.continue')}</button>
          </div>
          {loadingCafes && <div className="text-sm text-gray-500 mb-2">{t('createMeetup.loadingCafes')}</div>}
          {cafesError && <div className="text-red-500 text-sm mb-2">{cafesError}</div>}
          {!selectedCafe && <div className="text-red-500 text-sm mb-2">{t('createMeetup.errorCafeRequired')}</div>}
          <p className="text-sm text-gray-500 mb-4">{t('createMeetup.chooseCafeInfo')}</p>
        </div>
      )}
      {/* Stap 5: Samenvatting & bevestigen */}
      {step === 5 && (
        <div className="card bg-white border-2 border-primary-200 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('createMeetup.summary')}</h2>
          <div className="mb-4">
            <div className="mb-2"><span className="font-medium">{t('common.name')}:</span> {formData.name}</div>
            {!user && <div className="mb-2"><span className="font-medium">{t('common.email')}:</span> {email}</div>}
            <div className="mb-2"><span className="font-medium">{t('common.city')}:</span> {formData.city}</div>
            <div className="mb-2"><span className="font-medium">{t('common.selectedDates')}:</span>
              <ul className="list-disc ml-6">
                {formData.dates.map((date, idx) => {
                  const dateStr = getLocalDateString(date);
                  const dateOpt = dateTimeOptions.find(opt => opt.date === dateStr);
                  return (
                    <li key={idx}>
                      {date.toLocaleDateString()} ({(dateOpt?.times || []).map(ti => t(`common.${ti}`)).join(', ')})
                    </li>
                  );
                })}
              </ul>
            </div>
            {selectedCafe && (
              <div className="mb-2"><span className="font-medium">{t('common.cafe')}:</span> {selectedCafe.name}, {selectedCafe.address}</div>
            )}
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => goToStep(4)} className="btn-secondary flex-1">{t('common.back')}</button>
            <button type="button" onClick={handleSubmit} className="btn-primary flex-1" disabled={submitting}>{submitting ? t('common.loading') : t('common.submit')}</button>
          </div>
        </div>
      )}
      {showSuccess && successSummary && (
        <Toast
          message={t('toast.meetupCreated')}
          type="success"
          onClose={() => setShowSuccess(false)}
        />
      )}
      {/* Confetti bij succes */}
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
      {showMeetupToast && (
        <Toast
          message={t('toast.meetupCreated')}
          type="success"
          onClose={() => setShowMeetupToast(false)}
        />
      )}
      {formError && <div className="text-red-500 text-sm mb-2">{formError}</div>}
    </div>
  );
};

export default CreateMeetup; 