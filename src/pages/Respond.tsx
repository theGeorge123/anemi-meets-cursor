import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingIndicator from '../components/LoadingIndicator';
import SkeletonLoader from '../components/SkeletonLoader';
import FormStatus from '../components/FormStatus';

// TypeScript interfaces voor typeveiligheid
interface Invitation {
  token: string;
  cafe_id?: string;
  cafe_name?: string;
  cafe_address?: string;
  date_time_options?: { date: string; times: string[] }[];
}
interface Cafe { name: string; address: string; image_url?: string; }

const Respond = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    selectedTime: '',
  });
  const [availableTimes, setAvailableTimes] = useState<{date: string, time: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationInfo, setConfirmationInfo] = useState<any>(null);

  const UPDATES_EMAIL_KEY = 'anemi-updates-email';

  const getErrorMessage = (key: string, error: any) => {
    const translated = t(key);
    if (translated === key) {
      return `Error: ${error?.message || 'Unknown error'}`;
    }
    return translated;
  };

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      if (!token) {
        setError(getErrorMessage('respond.invalidInvitation', null));
        setLoading(false);
        return;
      }
      // Haal invitation op
      const { data: invitation, error: invitationError } = await supabase.from('invitations').select('*').eq('token', token).maybeSingle();
      if (invitationError) {
        setError(getErrorMessage('respond.expiredOrMissing', invitationError));
        setLoading(false);
        return;
      }
      if (!invitation) {
        setError(getErrorMessage('respond.expiredOrMissing', null));
        setLoading(false);
        return;
      }
      setInvitation(invitation as Invitation);
      // Haal cafe details op via cafe_id
      if (invitation.cafe_id) {
        const { data: cafeData, error: cafeError } = await supabase.from('cafes').select('name, address, image_url').eq('id', invitation.cafe_id).maybeSingle();
        if (!cafeError && cafeData) {
          setCafe({ name: cafeData.name, address: cafeData.address, image_url: cafeData.image_url } as Cafe);
        } else {
          setCafe(null);
        }
      } else {
        setCafe(null);
      }
      // Zet beschikbare tijden
      let times: {date: string, time: string}[] = [];
      if (invitation.date_time_options && Array.isArray(invitation.date_time_options)) {
        invitation.date_time_options.forEach((opt: {date: string, times: string[]}) => {
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
    // Prefill email if saved
    const savedEmail = localStorage.getItem(UPDATES_EMAIL_KEY);
    if (savedEmail) setFormData((prev) => ({ ...prev, email: savedEmail }));
  }, [location.search, t]);

  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      const content = viewport.getAttribute('content');
      if (content && !content.includes('maximum-scale')) {
        viewport.setAttribute('content', content + ', maximum-scale=1.0');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!formData.email) missing.push(i18n.language === 'nl' ? 'e-mailadres' : 'email address');
    if (!formData.selectedTime) missing.push(i18n.language === 'nl' ? 'tijd' : 'time');
    // Extra validatie op formaat selectedTime
    const lastDash = formData.selectedTime.lastIndexOf('-');
    const datePart = formData.selectedTime.substring(0, lastDash);
    const timePart = formData.selectedTime.substring(lastDash + 1);
    // Check cafe_id presence
    const cafeId = invitation?.cafe_id;
    if (!cafeId) missing.push(i18n.language === 'nl' ? 'café' : 'cafe');
    if (!datePart || !timePart || !/^[\d]{4}-[\d]{2}-[\d]{2}$/.test(datePart) || !['morning','afternoon','evening'].includes(timePart)) {
      setErrorMsg(getErrorMessage('respond.invalidDateFormat', null));
      return;
    }
    if (missing.length > 0) {
      setErrorMsg(
        getErrorMessage('common.errorMissingFields', { message: missing
            .map((field) =>
            field
            )
          .join(', ') })
      );
      return;
    }
    setErrorMsg("");
    if (!invitation) {
      setErrorMsg(getErrorMessage('respond.errorNoInvite', null));
      return;
    }
    // Sla email op als updates gewenst
    if (wantsUpdates) {
      localStorage.setItem(UPDATES_EMAIL_KEY, formData.email);
    } else {
      localStorage.removeItem(UPDATES_EMAIL_KEY);
    }
    try {
      const body: any = {
        token: invitation.token,
        email: formData.email,
        email_b: formData.email,
        selected_date: datePart,
        selected_time: timePart,
        cafe_id: cafeId
      };
      const authKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (import.meta.env.DEV) {
      console.log('DEBUG: VITE_SUPABASE_ANON_KEY:', authKey);
      console.log('DEBUG: fetch headers:', {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authKey}`
      });
      console.log('DEBUG: fetch body:', body);
      }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-meeting-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authKey}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Herkenbare foutmeldingen netjes vertalen
        let msg = getErrorMessage('respond.genericError', data.error);
        if (data.error && typeof data.error === 'string') {
          if (data.error.toLowerCase().includes('missing email')) {
            msg = i18n.language === 'nl'
              ? 'Vul je e-mailadres in!'
              : 'Please enter your email address!';
          } else if (data.error.toLowerCase().includes('missing cafe_id')) {
            msg = i18n.language === 'nl'
              ? 'Er ging iets mis met het café. Probeer het opnieuw of vraag je vriend(in) om een nieuwe uitnodiging!'
              : 'Something went wrong with the café info. Try again or ask your friend to send a new invite!';
          } else if (data.error.toLowerCase().includes('multiple (or no) rows returned')) {
            msg = i18n.language === 'nl'
              ? 'Deze uitnodiging is niet meer geldig. Vraag je vriend(in) om een nieuwe link!'
              : 'This invite link is no longer valid. Ask your friend for a new one!';
          }
        }
        const code = data.error_code || '';
        switch (code) {
          case 'missing_cafe_id':
            msg = i18n.language === 'nl'
              ? 'Er ging iets mis met het café. Probeer het opnieuw of vraag je vriend(in) om een nieuwe uitnodiging!'
              : 'Something went wrong with the café info. Try again or ask your friend to send a new invite!';
            break;
          case 'missing_email':
            msg = i18n.language === 'nl'
              ? 'Vul je e-mailadres in!'
              : 'Please enter your email address!';
            break;
          case 'authorization':
            msg = getErrorMessage('respond.errorSendMail', data.error);
            break;
          case 'expired_or_missing':
            msg = getErrorMessage('respond.expiredOrMissing', data.error);
            break;
          default:
            if (data && typeof data.error === 'string') {
              const err = data.error.toLowerCase();
              if (err.includes('missing cafe id')) {
                msg = i18n.language === 'nl'
                  ? 'Er ging iets mis met het café. Probeer het opnieuw of vraag je vriend(in) om een nieuwe uitnodiging!'
                  : 'Something went wrong with the café info. Try again or ask your friend to send a new invite!';
              } else if (err.includes('missing email')) {
                msg = i18n.language === 'nl'
                  ? 'Vul je e-mailadres in!'
                  : 'Please enter your email address!';
              } else if (err.includes('authorization')) {
                msg = getErrorMessage('respond.errorSendMail', data.error);
              } else if (err.includes('expired') || err.includes('not found')) {
                msg = getErrorMessage('respond.expiredOrMissing', data.error);
              }
            }
        }
        setErrorMsg(msg);
        console.error("Supabase error:", data.error || data);
      } else {
        setSubmitted(true);
        // Log en bewaar de response data
        console.log('Meeting bevestigd:', data);
        setConfirmationInfo({
          cafe_name: data.cafe_name,
          cafe_address: data.cafe_address,
          selected_date: data.selected_date,
          selected_time: data.selected_time
        });
        // Redirect na succes
        setTimeout(() => {
          window.location.href = "/confirmed";
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(getErrorMessage('respond.genericError', err));
      console.error("Netwerkfout:", err);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="card bg-[#fff7f3] shadow-2xl p-8 max-w-lg w-full flex flex-col items-center">
          <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>☕️</span>
          <h2 className="text-2xl font-bold text-primary-700 mb-2 flex items-center gap-2">
            {t('respond.meetupConfirmed')}
          </h2>
          <img src="/coffee-fun.gif" alt={t('respond.coffeeGifAlt')} style={{ maxWidth: 120, borderRadius: 16, margin: '1rem 0' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          <p className="text-lg text-gray-700 mb-6 text-center">
            {t('respond.emailSent')}
          </p>
          {confirmationInfo && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 w-full text-center">
              <div className="font-semibold text-primary-700 mb-1">{i18n.language === 'nl' ? 'Café' : 'Cafe'}: {confirmationInfo.cafe_name}</div>
              <div className="text-gray-600 mb-1">{i18n.language === 'nl' ? 'Adres' : 'Address'}: {confirmationInfo.cafe_address}</div>
              <div className="text-gray-600 mb-1">{i18n.language === 'nl' ? 'Datum' : 'Date'}: {confirmationInfo.selected_date}</div>
              <div className="text-gray-600">{i18n.language === 'nl' ? 'Tijd' : 'Time'}: {confirmationInfo.selected_time}</div>
            </div>
          )}
          <button className="btn-primary w-full mb-3" onClick={() => window.location.href = "/"}>{i18n.language === 'nl' ? 'Terug naar home' : 'Back to home'}</button>
          <div className="w-full flex flex-col items-center mt-2">
            <p className="mb-2">{t('respond.cta')}</p>
            <a href="/signup" className="btn-secondary w-full">{i18n.language === 'nl' ? 'Account aanmaken' : 'Create account'}</a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <LoadingIndicator label={i18n.language === 'nl' ? 'Laden...' : 'Loading...'} size="md" className="my-4" />
        <SkeletonLoader count={2} height="h-12" className="my-2" ariaLabel={i18n.language === 'nl' ? 'Laden...' : 'Loading...'} />
      </div>
    );
  }
  if (error) {
    return <div className="max-w-2xl mx-auto text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card bg-primary-50 mb-6">
        <h2 className="text-xl font-semibold text-primary-600">{i18n.language === 'nl' ? 'Café' : 'Cafe'}</h2>
        {cafe && cafe.image_url && (
          <img src={cafe.image_url} alt={cafe.name} className="w-full h-40 object-cover rounded-lg mb-2" />
        )}
        {cafe && cafe.name ? (
          <>
            <p className="text-gray-700 font-medium">{cafe.name}</p>
            {cafe.address && <p className="text-gray-500">{cafe.address}</p>}
          </>
        ) : invitation && invitation.cafe_id ? (
          <p className="text-gray-700 font-medium">ID: {invitation.cafe_id}</p>
        ) : (
          <p className="text-gray-500">{t('invite.cafeInfoPending')}</p>
        )}
      </div>
      <h1 className="text-3xl font-bold text-primary-600 mb-2">
        {t('respond.title')}
      </h1>
      <p className="text-gray-600 mb-2">
        {t('respond.subtitle')}
      </p>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-md p-4 mb-8 text-yellow-900 text-base font-medium shadow-sm">
        <span role="img" aria-label="coffee">☕️</span> {t('respond.explanation')}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && <FormStatus status="error" message={errorMsg} />}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            {t('respond.availableTimes')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableTimes.map((time, idx) => {
              const value = `${time.date}-${time.time}`;
              const isSelected = formData.selectedTime === value;
              // Format date as 'Monday 3 June' or 'maandag 3 juni'
              const dateObj = new Date(time.date);
              const formattedDate = dateObj.toLocaleDateString(i18n.language === 'nl' ? 'nl-NL' : 'en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              });
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, selectedTime: value }))}
                  className={`w-full p-4 rounded-xl border-2 font-semibold text-lg shadow-sm flex flex-col items-center justify-center transition-all duration-150
                    ${isSelected ? 'border-primary-600 bg-primary-100 text-primary-800 scale-105 ring-2 ring-primary-300' : 'border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50'}`}
                  aria-pressed={isSelected}
                >
                  <span>{formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}</span>
                  <span className="mt-1">{t(`common.${time.time}`)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {i18n.language === 'nl' ? 'Jouw e-mailadres' : 'Your email address'}
          </label>
          <input
            type="email"
            id="email"
            className="input-field mt-1"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
            autoFocus
            placeholder={i18n.language === 'nl' ? 'jij@voorbeeld.nl' : 'you@example.com'}
            inputMode="email"
            autoComplete="email"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="updates"
            checked={wantsUpdates}
            onChange={(e) => setWantsUpdates(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="updates" className="ml-2 text-sm text-gray-700">
            {i18n.language === 'nl' ? 'Houd me op de hoogte van Anemi Meets' : 'Keep me in the loop about Anemi Meets'}
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading
            ? (i18n.language === 'nl' ? 'Laden...' : 'Loading...')
            : (i18n.language === 'nl' ? 'Bevestigen & mijn koffiemomentje claimen!' : 'Confirm & claim my coffee spot!')}
        </button>
        <FormStatus status={loading ? 'loading' : submitted ? 'success' : errorMsg ? 'error' : 'idle'} message={confirmationInfo ? t('respond.success') : errorMsg || undefined} />
      </form>
    </div>
  );
};

export default Respond; 