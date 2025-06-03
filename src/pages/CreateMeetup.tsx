import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import "react-datepicker/dist/react-datepicker.css";
import Confetti from 'react-confetti';
import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import DateSelector from '../components/meetups/DateSelector';
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

async function flushMeetupQueue(supabase: any, onSuccess: () => void) {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (!queue.length) return;
  const newQueue = [];
  for (const payload of queue) {
    try {
      const { error } = await supabase.from('invitations').insert(payload);
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
  const { t } = useTranslation('meetup');
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [user, setUser] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const navigate = useNavigate();
  const [loadingCafes, setLoadingCafes] = useState(false);
  const [cafesError, setCafesError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Debug Supabase connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabase.from('cities').select('count');
        console.log('Supabase connection test:', { data, error });
        
        // Also log the current environment variables
        console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('Supabase Key (first 10 chars):', 
          import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...');
      } catch (err) {
        console.error('Supabase connection test failed:', err);
      }
    };
    testConnection();
  }, []);

  // 2. Add step validation logic
  const validateStep = async (currentStep: number) => {
    try {
      if (currentStep === 1) {
        // No validation needed for the first step
        setFormError(null);
        return true;
      } else if (currentStep === 2) {
        // No validation needed for the second step
        setFormError(null);
        return true;
      } else if (currentStep === 3) {
        // No validation needed for the third step
        setFormError(null);
        return true;
      } else if (currentStep === 4) {
        // No validation needed for the fourth step
        setFormError(null);
        return true;
      }
      return false; // This should never be reached
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
        setCafesError(t('errorCafesFetch'));
      } finally {
        setLoadingCafes(false);
      }
    };
    fetchCities();
  }, [formData.city, t]);

  useEffect(() => {
    // Scroll naar boven bij laden
    window.scrollTo(0, 0);
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

  // Flush queue bij online komen
  useEffect(() => {
    const flush = () => flushMeetupQueue(supabase, () => setQueueCount(q => q - 1));
    window.addEventListener('online', flush);
    // Initieel ook proberen flushen
    flush();
    return () => window.removeEventListener('online', flush);
  }, []);

  // Update queueCount
  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    setQueueCount(queue.length);
  }, []);

  // Helper for error translations with fallback
  const getErrorMessage = (key: string, error: any) => {
    const translated = t(key);
    if (translated === key) {
      return `Error: ${error?.message || 'Unknown error'}`;
    }
    return translated;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Log the form data for debugging
    console.log('Submitting form data:', formData);
    console.log('Selected cafe:', selectedCafe);
    console.log('Date/time options:', dateTimeOptions);

    // Validation (keep existing validation)
    if (formData.dates.length === 0) {
      setFormError(t('requiredTime'));
      return;
    }
    const hasAnyTime = dateTimeOptions.some(opt => opt.times.length > 0);
    if (!hasAnyTime) {
      setFormError(t('requiredTime'));
      return;
    }
    if (!formData.name || !formData.city || !selectedCafe) {
      setFormError(t('errorMissingFields', { fields: [!formData.name ? t('name') : '', !formData.city ? t('city') : '', !selectedCafe ? t('cafe') : ''].filter(Boolean).join(', ') }));
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
      setFormError(t('requiredTime'));
      return;
    }

    // Prepare payload
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    console.log('Generated token:', token);

    const payload: any = {
      token,
      invitee_name: formData.name,
      status: "pending",
      selected_date: firstDateOpt.date,
      selected_time: firstDateOpt.times[0],
      cafe_id: selectedCafe.id,
      date_time_options: filteredDateTimeOptions
    };

    // If user is not logged in, add email if available
    if (!user && formData.email) {
      payload.email_b = formData.email;
    }

    console.log('Payload to insert:', payload);

    try {
      // First, check if we can read from the table
      const { data: checkData, error: checkError } = await supabase
        .from('invitations')
        .select('count');

      console.log('Table access check:', { data: checkData, error: checkError });

      // Now try the insert
      console.log('Attempting to insert invitation...');
      const { data: insertData, error: insertError } = await supabase
        .from('invitations')
        .insert(payload)
        .select();

      console.log('Insert result:', { data: insertData, error: insertError });

      if (insertError) {
        console.error('Insert error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });

        // Display a more detailed error message
        let errorMessage = getErrorMessage('errorCreatingInvite', insertError);
        if (insertError.details) {
          errorMessage += ` (${insertError.details})`;
        }
        if (insertError.hint) {
          errorMessage += ` Hint: ${insertError.hint}`;
        }

        setFormError(errorMessage);
        return;
      }

      if (!insertData || insertData.length === 0) {
        console.error('No data returned from insert');
        setFormError('No data returned from database. The invitation might not have been created.');
        return;
      }

      // Success path
      const createdInvite = insertData[0];
      console.log('Created invitation:', createdInvite);
      const responseToken = createdInvite.token;

      if (responseToken) {
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          if (typeof navigate === 'function') {
            navigate(`/invite/${responseToken}`);
          } else {
            window.location.href = `/invite/${responseToken}`;
          }
        }, 2000);
      } else {
        setFormError('Created invitation is missing token');
      }
    } catch (err) {
      console.error('Unexpected error during submission:', err);
      setFormError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
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
        {t('title')}
      </h1>
      <p className="text-gray-700 mb-8 text-lg">
        {t('subtitle')}
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
            {/* Email for non-logged-in users */}
            {!user && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">{t('common.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={t('common.email')}
                  required
                />
                {emailError && <div className="text-red-500 text-sm mt-1">{emailError}</div>}
              </div>
            )}
            <label className="block text-gray-700 mb-2">
              {t('createMeetup.chooseCityLabel')}
            </label>
            {/* Show city selection if cities are available */}
            {cities.length > 0 ? (
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
            ) : (
              // Show message and default city button if no cities are available
              <div>
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                  {t('createMeetup.noCitiesAvailable', 'No cities available. Using Rotterdam as default.')}
                </div>
                <button
                  type="button"
                  onClick={() => handleCityChange('Rotterdam')}
                  className="p-4 rounded-xl border-2 transition-all duration-150 font-semibold text-lg shadow-sm flex items-center justify-center border-primary-600 bg-primary-100 text-primary-800"
                >
                  Rotterdam
                </button>
              </div>
            )}
          </div>
          {/* Show any form errors */}
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {formError}
            </div>
          )}
          <button
            onClick={() => {
              // Reset any previous errors
              setFormError(null);
              // Basic email validation for non-logged-in users
              if (!user) {
                if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                  setEmailError(t('common.error_invalid_email', 'Please enter a valid email address'));
                  return;
                } else {
                  setEmailError('');
                }
              }
              // If no city is selected but we have a name, use Rotterdam as default
              if (!formData.city && formData.name) {
                setFormData(prev => ({ ...prev, city: 'Rotterdam' }));
              }
              // If we still don't have a city, show error
              if (!formData.city) {
                setFormError(t('createMeetup.pleaseSelectCity', 'Please select a city'));
                return;
              }
              // All good, proceed to next step
              setStep(2);
            }}
            disabled={!formData.name || (!user && !email)}
            className="btn-primary w-full py-3 px-6 text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {t('common.continue')}
          </button>
        </div>
      )}
      {/* Stap 2: Datum/tijd kiezen */}
      {step === 2 && (
        <DateSelector
          selectedDates={formData.dates}
          setSelectedDates={(dates: Date[]) => setFormData(prev => ({ ...prev, dates }))}
          dateTimeOptions={dateTimeOptions}
          setDateTimeOptions={setDateTimeOptions}
          error={formError}
        />
      )}
      {/* Stap 3: Café kiezen */}
      {step === 3 && (
        <div className="card bg-primary-50 p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('chooseCafe')}</h2>
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
            <button type="button" onClick={() => goToStep(2)} className="btn-secondary flex-1">{t('common.back')}</button>
            <button type="button" onClick={() => goToStep(4)} className="btn-primary flex-1" disabled={!selectedCafe}>{t('common.continue')}</button>
          </div>
          {loadingCafes && <div className="text-sm text-gray-500 mb-2">{t('loadingCafes')}</div>}
          {cafesError && <div className="text-red-500 text-sm mb-2">{t('errorCafesFetch')}</div>}
          {!selectedCafe && <div className="text-red-500 text-sm mb-2">{t('errorCafeRequired')}</div>}
          <p className="text-sm text-gray-500 mb-4">{t('chooseCafeInfo')}</p>
        </div>
      )}
      {/* Stap 4: Samenvatting & bevestigen */}
      {step === 4 && (
        <div className="card bg-white border-2 border-primary-200 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-primary-700 mb-6">{t('summary')}</h2>
          <div className="mb-4">
            <div className="mb-2"><span className="font-medium">{t('name')}:</span> {formData.name}</div>
            <div className="mb-2"><span className="font-medium">{t('city')}:</span> {formData.city}</div>
            <div className="mb-2"><span className="font-medium">{t('selectedDates')}:</span>
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
              <div className="mb-2"><span className="font-medium">{t('cafe')}:</span> {selectedCafe.name}, {selectedCafe.address}</div>
            )}
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={() => goToStep(3)} className="btn-secondary flex-1">{t('common.back')}</button>
            <button type="button" onClick={handleSubmit} className="btn-primary flex-1">Submit</button>
          </div>
        </div>
      )}
      {showSuccess && (
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
      {queueCount > 0 && (
        <div className="mb-4 p-3 rounded bg-yellow-200 text-yellow-900 text-center font-semibold">
          {t('queueNotice', 'Er staan acties in de wachtrij. Ze worden verstuurd zodra je weer online bent.')}
        </div>
      )}
    </div>
  );
};

const CreateMeetupWithBoundary = () => (
  <ErrorBoundary>
    <CreateMeetup />
  </ErrorBoundary>
);

export default CreateMeetupWithBoundary; 