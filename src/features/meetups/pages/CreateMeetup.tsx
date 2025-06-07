import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getSession } from '../../../services/authService';
import { fetchCities, fetchCafesByCity, insertInvitation, checkInvitationTable } from '../../../services/meetupService';
import "react-datepicker/dist/react-datepicker.css";
import DateSelector from '../../../components/meetups/DateSelector';
import { useNavigate } from 'react-router-dom';

interface City { id: string; name: string; }
interface Cafe { id: string; name: string; address: string; description?: string; image_url?: string; }

const getLastCity = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('lastCity') || '';
  }
  return '';
};

const QUEUE_KEY = 'meetups_queue_v1';

async function flushMeetupQueue(onSuccess: () => void) {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (!queue.length) return;
  const newQueue = [];
  for (const payload of queue) {
    try {
      const { error } = await insertInvitation(payload);
      if (error) {
        newQueue.push(payload); // niet gelukt, blijft in queue
      } else {
        onSuccess();
      }
    } catch {
      newQueue.push(payload);
    }
  }
  localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
}

const CreateMeetup = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    dates: [] as Date[],
    timePreference: '',
    city: '',
    email: '',
  });
  const [cities, setCities] = useState<City[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [dateTimeOptions, setDateTimeOptions] = useState<{ date: string; times: string[] }[]>([]);
  const [shuffleCooldown, setShuffleCooldown] = useState(false);
  const shuffleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [cityError, setCityError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch cities (no longer restricted to just Rotterdam)
  useEffect(() => {
    const loadCities = async () => {
      setIsLoadingCities(true);
      setCityError(null);
      try {
        // Fetch all cities instead of filtering to Rotterdam only
        const { data, error } = await fetchCities();
        if (error) {
          console.error('Error fetching cities:', error);
          setCityError(t('common.errorLoadingCities'));
          // Provide default cities if the query fails
          setCities([
            { id: 'default-rotterdam', name: 'Rotterdam' },
            { id: 'default-amsterdam', name: 'Amsterdam' },
            { id: 'default-utrecht', name: 'Utrecht' }
          ]);
        } else if (data && data.length > 0) {
          setCities(data as City[]);
        } else {
          // If no cities found in the database, create default ones
          setCities([
            { id: 'default-rotterdam', name: 'Rotterdam' },
            { id: 'default-amsterdam', name: 'Amsterdam' },
            { id: 'default-utrecht', name: 'Utrecht' }
          ]);
        }
      } catch (err) {
        console.error('Exception fetching cities:', err);
        setCityError(t('common.errorLoadingCities'));
        // Fallback to default cities
        setCities([
          { id: 'default-rotterdam', name: 'Rotterdam' },
          { id: 'default-amsterdam', name: 'Amsterdam' },
          { id: 'default-utrecht', name: 'Utrecht' }
        ]);
      } finally {
        setIsLoadingCities(false);
      }
    };
    loadCities();
  }, [t]);

  // Fetch cafes for selected city
  useEffect(() => {
    const fetchCafes = async () => {
      if (!formData.city) return setCafes([]);
      try {
        const { data, error } = await fetchCafesByCity(formData.city);
        if (error) {
          console.error('Error fetching cafes:', error);
          // If no cafes found, create a default one to ensure the flow can continue
          setCafes([{
            id: 'default-cafe',
            name: 'Default Café',
            address: 'City Center',
            description: 'A cozy place to meet'
          }]);
        } else if (data && data.length > 0) {
          setCafes(data as Cafe[]);
        } else {
          // If no cafes found, create a default one
          setCafes([{
            id: 'default-cafe',
            name: 'Default Café',
            address: 'City Center',
            description: 'A cozy place to meet'
          }]);
        }
      } catch (err) {
        console.error('Exception fetching cafes:', err);
        // Fallback to default cafe
        setCafes([{
          id: 'default-cafe',
          name: 'Default Café',
          address: 'City Center',
          description: 'A cozy place to meet'
        }]);
      }
    };
    fetchCafes();
  }, [formData.city]);

  useEffect(() => {
    // Scroll naar boven bij laden
    window.scrollTo(0, 0);
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await getSession();
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

  // Flush queue bij online komen
  useEffect(() => {
    const flush = () => flushMeetupQueue(() => {});
    window.addEventListener('online', flush);
    // Initieel ook proberen flushen
    flush();
    return () => window.removeEventListener('online', flush);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Log the form data for debugging (development only)
    if (import.meta.env.DEV) {
      console.log('Submitting form data:', formData);
      console.log('Selected cafe:', selectedCafe);
      console.log('Date/time options:', dateTimeOptions);
    }

    // Validation (keep existing validation)
    if (formData.dates.length === 0) {
      setFormError(t('meetup.requiredTime'));
      return;
    }
    const hasAnyTime = dateTimeOptions.some(opt => opt.times.length > 0);
    if (!hasAnyTime) {
      setFormError(t('meetup.requiredTime'));
      return;
    }
    if (!formData.name || !formData.city || !selectedCafe) {
      setFormError(t('meetup.errorMissingFields', { fields: [!formData.name ? t('meetup.name') : '', !formData.city ? t('meetup.city') : '', !selectedCafe ? t('meetup.cafe') : ''].filter(Boolean).join(', ') }));
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
      setFormError(t('meetup.requiredTime'));
      return;
    }

    // Prepare payload
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    if (import.meta.env.DEV) {
      console.log('Generated token:', token);
    }

    const payload: any = {
      token,
      invitee_name: formData.name,
      status: "pending",
      selected_date: firstDateOpt.date,
      selected_time: firstDateOpt.times[0],
      cafe_id: selectedCafe.id,
      date_time_options: filteredDateTimeOptions
    };

    // Store the creator's email so the confirmation can be sent later
    if (user?.email) {
      payload.email_a = user.email;
    } else if (formData.email) {
      payload.email_a = formData.email;
    }

    if (import.meta.env.DEV) {
      console.log('Payload to insert:', payload);
    }

    try {
      // First, check if we can read from the table
      const { data: checkData, error: checkError } = await checkInvitationTable();

      if (import.meta.env.DEV) {
        console.log('Table access check:', { data: checkData, error: checkError });
      }

      // Now try the insert
      if (import.meta.env.DEV) {
        console.log('Attempting to insert invitation...');
      }
      const { data: insertData, error: insertError } = await insertInvitation(payload);

      if (import.meta.env.DEV) {
        console.log('Insert result:', { data: insertData, error: insertError });
      }

        if (insertError) {
          console.error('Insert error details:', insertError);
          const code = insertError.code || '';
          let msg = '';
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
          setFormError(msg);
          return;
        }

      let responseToken = token;
      if (!insertData || insertData.length === 0) {
        if (import.meta.env.DEV) {
          console.warn('No data returned from insert; using generated token');
        }
      } else {
        if (import.meta.env.DEV) {
          console.log('Created invitation:', insertData[0]);
        }
        if (insertData[0].token) {
          responseToken = insertData[0].token as string;
        }
      }

      // Navigate to the invite page regardless of the returned data
      setTimeout(() => {
        if (typeof navigate === 'function') {
          navigate(`/invite/${responseToken}`);
        } else {
          window.location.href = `/invite/${responseToken}`;
        }
      }, 2000);
    } catch (err) {
      console.error('Exception during invitation creation:', err);
      setFormError(t('common.errorNetwork'));
    }
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
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Sticky header for title and subtitle */}
      <div className="sticky top-0 z-20 bg-primary-50/90 backdrop-blur-md pb-2 sm:static sm:bg-transparent sm:backdrop-blur-none">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-primary-700 mb-2 sm:mb-4 text-center drop-shadow-sm">
          {t('meetup.title', "Let's plan a coffee meetup! ☕️")}
      </h1>
        <p className="text-gray-600 mb-4 sm:mb-8 text-base sm:text-lg text-center font-medium">
          {t('meetup.subtitle', "Just a few quick steps and you're ready to invite!")}
      </p>
      </div>
      {/* Stepper with improved circles and labels */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        <div className="flex gap-2 items-center w-full overflow-x-auto justify-center">
          {(() => {
            // Fun, informal, slightly longer step labels, i18n
            const stepLabels = [
              t('meetup.step1', 'Who are you?'),
              t('meetup.step2', 'Pick a city!'),
              t('meetup.step3', 'Choose dates'),
              t('meetup.step4', 'Pick a café'),
              t('meetup.step5', 'All done! 🎉'),
            ];
            return [1,2,3,4,5].map((s, i) => {
              const isActive = step === s;
              const isCompleted = step > s;
              return (
            <React.Fragment key={s}>
                  <div className="flex flex-col items-center mx-1 min-w-[70px]">
                    <div
                      className={[
                        'w-9 h-9 flex items-center justify-center rounded-full font-bold text-base border-2 transition-all duration-200',
                        isActive
                          ? 'bg-primary-600 text-white border-primary-700 shadow-md'
                          : isCompleted
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-white text-gray-400 border-gray-300',
                      ].join(' ')}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {isCompleted && !isActive ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <span className="flex items-center justify-center w-full h-full">{s}</span>
                      )}
                    </div>
                    <span className={`text-xs mt-1 max-w-[90px] text-center font-medium transition-all duration-200
                      ${isActive ? 'text-primary-700 font-bold' : 'text-gray-400'}`}
                      style={{whiteSpace: 'normal', overflowWrap: 'break-word'}}
                    >{stepLabels[i]}</span>
              </div>
                  {i < 4 && <div className={`w-5 h-0.5 rounded-full mx-1 transition-all duration-200 ${step > s ? 'bg-primary-400' : 'bg-primary-200'}`} />}
            </React.Fragment>
              );
            });
          })()}
        </div>
      </div>
      {/* Stap 1: Contactpersoon */}
      {step === 1 && (
        <div className="card bg-primary-50 p-4 sm:p-6 rounded-xl shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-700 mb-4 sm:mb-6">
            {t('meetup.contactInfo', 'Let\'s get to know you!')}
          </h2>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="name">
              {t('meetup.nameLabel', 'What\'s your beautiful name? (Or your nickname!)')}
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4 focus-visible:ring-2 focus-visible:ring-primary-500"
              placeholder={t('meetup.name', 'Name')}
            />
            {/* Email for non-logged-in users */}
            {!user && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="email">{t('meetup.emailLabel', 'Your email address')}</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500"
                  placeholder={t('meetup.emailLabel', 'Your email address')}
                  required
                />
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => {
                setFormError(null);
                if (!formData.name) {
                  setFormError(t('meetup.errorNameRequired', 'Name is required'));
                  return;
                }
                if (!user) {
                  if (!formData.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
                    setFormError(t('common.error_invalid_email', 'Please enter a valid email address'));
                    return;
                  }
                }
                setStep(2);
              }}
              disabled={!formData.name || (!user && !formData.email)}
              className="btn-primary w-full py-3 px-6 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {t('meetup.continue', 'Continue')}
            </button>
          </div>
        </div>
      )}
      {/* Stap 2: Stad kiezen */}
      {step === 2 && (
        <div className="card bg-primary-50 p-4 sm:p-6 rounded-xl shadow-md flex flex-col items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-700 mb-4 sm:mb-6 text-center">
            {t('meetup.chooseCity', 'Choose your city')}
          </h2>
          <p className="text-gray-700 mb-6 sm:mb-8 text-base sm:text-lg text-center">
            {t('createMeetup.chooseCityInfo', 'Choose your city! That way we know where to find the best spots for you')}
          </p>
          <label className="block text-gray-700 mb-2 text-center">
            {t('createMeetup.chooseCityLabel', 'Pick a city')}
          </label>
          {isLoadingCities ? (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-center">
              {t('meetup.loadingCities', 'Loading cities...')}
            </div>
          ) : cityError ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center">
              {cityError}
            </div>
          ) : cities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 w-full max-w-md mx-auto">
            {cities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, city: city.name }))}
                className={`p-4 rounded-xl border-2 transition-all duration-150 font-semibold text-lg shadow-sm flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary-500 w-full
                  ${formData.city === city.name ? 'border-primary-600 bg-primary-100 text-primary-800 scale-105 ring-2 ring-primary-300' : 'border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50'}`}
                aria-pressed={formData.city === city.name}
              >
                {city.name}
              </button>
            ))}
          </div>
          ) : (
            <div>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-center">
                {t('meetup.noCitiesAvailable', 'No cities available. Using Rotterdam as default.')}
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, city: 'Rotterdam' }))}
                className="p-4 rounded-xl border-2 transition-all duration-150 font-semibold text-lg shadow-sm flex items-center justify-center border-primary-600 bg-primary-100 text-primary-800 focus-visible:ring-2 focus-visible:ring-primary-500 w-full"
              >
                Rotterdam
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 w-full">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary flex-1 focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {t('meetup.back', 'Back')}
            </button>
            <button
              type="button"
              className="btn-primary flex-1 focus-visible:ring-2 focus-visible:ring-primary-500"
              disabled={!formData.city}
              onClick={() => setStep(3)}
            >
              {t('meetup.continue', "Let's go!")}
            </button>
          </div>
        </div>
      )}
      {/* Stap 3: Café kiezen */}
      {step === 3 && (
        <div className="card bg-primary-50 p-4 sm:p-6 rounded-xl shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold text-primary-700 mb-3 sm:mb-4">
            {t('chooseDates', 'Pick your dates')}
          </h2>
          <p className="mb-3 sm:mb-4 text-gray-700 text-sm sm:text-base">{t('chooseTimes', 'Pick your preferred times for each date')}</p>
        <DateSelector
          selectedDates={formData.dates}
          setSelectedDates={update =>
            setFormData(prev => ({
              ...prev,
              dates:
                typeof update === 'function'
                  ? update(prev.dates)
                  : update,
            }))
          }
          dateTimeOptions={dateTimeOptions}
          setDateTimeOptions={setDateTimeOptions}
          error={formError}
        />
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800" aria-live="polite">
              {formError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
            <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1 focus-visible:ring-2 focus-visible:ring-primary-500">{t('meetup.back', 'Back')}</button>
            <button
              type="button"
              className="btn-primary flex-1 focus-visible:ring-2 focus-visible:ring-primary-500"
              disabled={formData.dates.length === 0 || !dateTimeOptions.some(opt => opt.times && opt.times.length > 0)}
              onClick={() => {
                if (formData.dates.length === 0) {
                  setFormError(t('errorDatesRequired', 'Please select at least one date.'));
                  return;
                }
                if (!dateTimeOptions.some(opt => opt.times && opt.times.length > 0)) {
                  setFormError(t('errorTimesRequired', 'Please select at least one time.'));
                  return;
                }
                setFormError(null);
                setStep(4);
              }}
            >
              {t('meetup.continue', "Let's go!")}
            </button>
          </div>
        </div>
      )}
      {/* Stap 4: Café kiezen */}
      {step === 4 && (
        <div className="card bg-primary-50 p-4 sm:p-6 rounded-xl shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-700 mb-4 sm:mb-6">{t('meetup.chooseCafe', 'Pick your café!')}</h2>
          {selectedCafe && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
              {selectedCafe.image_url && (
                <img
                  src={selectedCafe.image_url}
                  alt={selectedCafe.name}
                  className="w-full h-40 sm:h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">{selectedCafe.name}</h3>
                <p className="text-gray-600 mb-2">{selectedCafe.address}</p>
                {selectedCafe.description && (
                  <p className="text-gray-500 text-sm">{selectedCafe.description}</p>
                )}
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
            <button type="button" onClick={shuffleCafe} disabled={shuffleCooldown || cafes.length <= 1} className="btn-secondary flex-1 focus-visible:ring-2 focus-visible:ring-primary-500">
              {/* Shuffle button */}
              {t('meetup.shuffle', 'Shuffle!') === 'meetup.shuffle' ? 'Shuffle!' : t('meetup.shuffle', 'Shuffle!')}
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4 text-center">{t('meetup.chooseCafeInfo', 'Pick your favorite spot or shuffle for a surprise!')}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button type="button" onClick={() => setStep(3)} className="btn-secondary flex-1 focus-visible:ring-2 focus-visible:ring-primary-500">
              {/* Back button */}
              {t('meetup.back', 'Back') === 'meetup.back' ? 'Back' : t('meetup.back', 'Back')}
            </button>
            <button type="button" onClick={handleSubmit} className="btn-primary flex-1 focus-visible:ring-2 focus-visible:ring-primary-500" disabled={!selectedCafe}>
              {/* Continue button */}
              {t('meetup.continue', "Let's go!") === 'meetup.continue' ? "Let's go!" : t('meetup.continue', "Let's go!")}
            </button>
          </div>
          {formError && <div className="text-red-500 text-sm mb-2" aria-live="polite">{formError}</div>}
        </div>
      )}
      {/* Stap 5: Samenvatting & bevestigen */}
      {step === 5 && (
        <div className="card bg-white border-2 border-primary-200 p-4 sm:p-6 rounded-xl shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-700 mb-4 sm:mb-6">{t('meetup.summary')}</h2>
          <div className="mb-4">
            <div className="mb-2"><span className="font-medium">{t('meetup.name')}:</span> {formData.name}</div>
            <div className="mb-2"><span className="font-medium">{t('meetup.city')}:</span> {formData.city}</div>
            <div className="mb-2"><span className="font-medium">{t('meetup.selectedDates')}:</span>
              <ul className="list-disc ml-6">
                {formData.dates.map(date => {
                  const dateStr = getLocalDateString(date);
                  const dateOpt = dateTimeOptions.find(opt => opt.date === dateStr);
                  return (
                    <li key={dateStr}>
                      {date.toLocaleDateString()} ({(dateOpt?.times || []).join(', ')})
                    </li>
                  );
                })}
              </ul>
            </div>
            {selectedCafe && (
              <div className="mb-2"><span className="font-medium">{t('meetup.cafe')}:</span> {selectedCafe.name}, {selectedCafe.address}</div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button type="button" onClick={() => setStep(4)} className="btn-secondary flex-1 focus-visible:ring-2 focus-visible:ring-primary-500">{t('meetup.back', 'Back')}</button>
            <button type="button" onClick={handleSubmit} className="btn-primary flex-1 focus-visible:ring-2 focus-visible:ring-primary-500">{t('meetup.submit')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMeetup;
