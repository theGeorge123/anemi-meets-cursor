import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingIndicator from '../components/LoadingIndicator';
import SkeletonLoader from '../components/SkeletonLoader';
import FormStatus from '../components/FormStatus';
import type { TFunction, i18n as I18n } from 'i18next';
import { Database } from '../types/supabase';
import { isDateTimeOptions } from '../utils/typeGuards';

type Invitation = Database['public']['Tables']['invitations']['Row'];
type Cafe = Database['public']['Tables']['cafes']['Row'];

interface ConfirmationInfo {
  cafe_name: string;
  cafe_address: string;
  selected_date: string;
  selected_time: string;
  ics_base64?: string;
}

const Respond = () => {
  const { t, i18n: _i18n } = useTranslation();
  const { token } = useParams();
  const [formData, setFormData] = useState({
    email: '',
    selectedTime: '',
  });
  const [availableTimes, setAvailableTimes] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationInfo, setConfirmationInfo] = useState<ConfirmationInfo | null>(null);

  const UPDATES_EMAIL_KEY = 'anemi-updates-email';

  interface GenericError {
    message?: string;
  }
  function getRespondErrorMessage(t: TFunction, key: string, error: GenericError | null): string {
    const translated = t(key);
    if (translated === key) {
      return `Error: ${error?.message || 'Unknown error'}`;
    }
    return translated;
  }

  function mapRespondError(
    t: TFunction,
    data: { error?: string; error_code?: string },
    _i18n: I18n,
  ) {
    let msg = getRespondErrorMessage(
      t,
      'respond.genericError',
      typeof data.error === 'string' ? { message: data.error } : null,
    );
    if (data.error && typeof data.error === 'string') {
      const err = data.error.toLowerCase();
      if (err.includes('missing email')) {
        msg =
          _i18n.language === 'nl' ? 'Vul je e-mailadres in!' : 'Please enter your email address!';
      } else if (err.includes('missing cafe_id') || err.includes('missing cafe id')) {
        msg =
          _i18n.language === 'nl'
            ? 'Er ging iets mis met het café. Probeer het opnieuw of vraag je vriend(in) om een nieuwe uitnodiging!'
            : 'Something went wrong with the café info. Try again or ask your friend to send a new invite!';
      } else if (err.includes('multiple (or no) rows returned')) {
        msg =
          _i18n.language === 'nl'
            ? 'Deze uitnodiging is niet meer geldig. Vraag je vriend(in) om een nieuwe link!'
            : 'This invite link is no longer valid. Ask your friend for a new one!';
      } else if (err.includes('authorization')) {
        msg = getRespondErrorMessage(
          t,
          'respond.errorSendMail',
          typeof data.error === 'string' ? { message: data.error } : null,
        );
      } else if (err.includes('expired') || err.includes('not found')) {
        msg = getRespondErrorMessage(
          t,
          'respond.expiredOrMissing',
          typeof data.error === 'string' ? { message: data.error } : null,
        );
      }
    }
    const code = data.error_code || '';
    switch (code) {
      case 'missing_cafe_id':
        msg =
          _i18n.language === 'nl'
            ? 'Er ging iets mis met het café. Probeer het opnieuw of vraag je vriend(in) om een nieuwe uitnodiging!'
            : 'Something went wrong with the café info. Try again or ask your friend to send a new invite!';
        break;
      case 'missing_email':
        msg =
          _i18n.language === 'nl' ? 'Vul je e-mailadres in!' : 'Please enter your email address!';
        break;
      case 'authorization':
        msg = getRespondErrorMessage(
          t,
          'respond.errorSendMail',
          typeof data.error === 'string' ? { message: data.error } : null,
        );
        break;
      case 'expired_or_missing':
        msg = getRespondErrorMessage(
          t,
          'respond.expiredOrMissing',
          typeof data.error === 'string' ? { message: data.error } : null,
        );
        break;
      default:
        // already handled above
        break;
    }
    return msg;
  }

  const TIME_SLOT_LABELS: Record<string, string> = {
    morning: '07:00–12:00',
    afternoon: '12:00–16:00',
    evening: '16:00–19:00',
  };

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
    let didCancel = false;
    const fetchData = async () => {
      try {
        if (!token) {
          if (!didCancel) {
            setError(getRespondErrorMessage(t, 'respond.invalidInvitation', null));
            setLoading(false);
          }
          return;
        }
        // Haal invitation op
        const { data: invitation, error: invitationError } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', token)
          .maybeSingle();
        if (invitationError) {
          console.error('Supabase invitation error:', invitationError);
          if (!didCancel) {
            setError(
              getRespondErrorMessage(t, 'respond.expiredOrMissing', invitationError ?? null),
            );
            setLoading(false);
          }
          return;
        }
        if (!invitation) {
          if (!didCancel) {
            setError(getRespondErrorMessage(t, 'respond.expiredOrMissing', null));
            setLoading(false);
          }
          return;
        }
        setInvitation(invitation);
        // Haal cafe details op via cafe_id
        if (invitation.cafe_id) {
          const { data: cafeData, error: cafeError } = await supabase
            .from('cafes')
            .select('name, address, image_url')
            .eq('id', invitation.cafe_id)
            .maybeSingle();
          if (!cafeError && cafeData) {
            setCafe(cafeData as Cafe);
          } else {
            if (cafeError) console.error('Supabase cafe error:', cafeError);
            setCafe(null);
          }
        } else {
          setCafe(null);
        }
        // Zet beschikbare tijden
        const times: { [key: string]: string[] } = {};
        if (isDateTimeOptions(invitation.date_time_options)) {
          invitation.date_time_options.forEach((opt) => {
            if (opt.date && opt.times && opt.times.length > 0) {
              times[opt.date] = opt.times;
            }
          });
        }
        setAvailableTimes(times);
        setFormData((prev) => ({ ...prev, email: '' }));
        if (!didCancel) setLoading(false);
      } catch (err) {
        console.error('Unexpected error in fetchData:', err);
        if (!didCancel) {
          setError(
            getRespondErrorMessage(
              t,
              'respond.genericError',
              err && typeof err === 'object' && 'message' in err
                ? (err as GenericError)
                : { message: String(err) },
            ),
          );
          setLoading(false);
        }
      }
    };
    fetchData();
    // Prefill email if saved
    const savedEmail = localStorage.getItem(UPDATES_EMAIL_KEY);
    if (savedEmail) setFormData((prev) => ({ ...prev, email: savedEmail }));
    // Timeout fallback: after 15 minutes, show error if still loading
    const timeout = setTimeout(() => {
      if (!didCancel && loading) {
        setError('Loading is taking too long. Please check your invite link or try again later.');
        setLoading(false);
      }
    }, 900000); // 15 minutes
    return () => {
      didCancel = true;
      clearTimeout(timeout);
    };
  }, [token, t]);

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
    if (!formData.email) missing.push(_i18n.language === 'nl' ? 'e-mailadres' : 'email address');
    if (!formData.selectedTime) missing.push(_i18n.language === 'nl' ? 'tijd' : 'time');
    // Extra validatie op formaat selectedTime
    const lastDash = formData.selectedTime.lastIndexOf('-');
    const datePart = formData.selectedTime.substring(0, lastDash);
    const timePart = formData.selectedTime.substring(lastDash + 1);
    // Check cafe_id presence
    const cafeId = invitation?.cafe_id;
    if (!cafeId) missing.push(_i18n.language === 'nl' ? 'café' : 'cafe');
    if (
      !datePart ||
      !timePart ||
      !/^[\d]{4}-[\d]{2}-[\d]{2}$/.test(datePart) ||
      !['morning', 'afternoon', 'evening'].includes(timePart)
    ) {
      setErrorMsg(getRespondErrorMessage(t, 'respond.invalidDateFormat', null));
      return;
    }
    if (missing.length > 0) {
      setErrorMsg(
        getRespondErrorMessage(t, 'common.errorMissingFields', {
          message: missing.map((field) => field).join(', '),
        }),
      );
      return;
    }
    setErrorMsg('');
    if (!invitation) {
      setErrorMsg(getRespondErrorMessage(t, 'respond.errorNoInvite', null));
      return;
    }
    // Sla email op als updates gewenst
    if (wantsUpdates) {
      localStorage.setItem(UPDATES_EMAIL_KEY, formData.email);
    } else {
      localStorage.removeItem(UPDATES_EMAIL_KEY);
    }
    try {
      interface ConfirmRequestBody {
        token: string;
        email: string;
        email_b: string;
        email_a?: string;
        selected_date: string;
        selected_time: string;
        cafe_id: string;
      }

      const body: ConfirmRequestBody = {
        token: token || '',
        email: formData.email,
        email_b: formData.email,
        email_a: invitation?.email_b || '',
        selected_date: datePart,
        selected_time: timePart,
        cafe_id: cafeId!,
      };
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-meeting-confirmation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          setErrorMsg(
            _i18n.language === 'nl'
              ? 'Je sessie is verlopen of je bent niet ingelogd. Log opnieuw in en probeer het nog eens.'
              : 'Your session has expired or you are not logged in. Please log in again and try.',
          );
        } else if (
          data.error &&
          typeof data.error === 'string' &&
          data.error.toLowerCase().includes('already accepted')
        ) {
          setErrorMsg(
            _i18n.language === 'nl'
              ? 'Deze uitnodiging is al geaccepteerd.'
              : 'This invite has already been accepted.',
          );
        } else if (
          data.error &&
          typeof data.error === 'string' &&
          (data.error.toLowerCase().includes('expired') ||
            data.error.toLowerCase().includes('not found'))
        ) {
          setErrorMsg(
            _i18n.language === 'nl'
              ? 'Deze uitnodiging is verlopen of ongeldig.'
              : 'This invitation is expired or invalid.',
          );
        } else {
          setErrorMsg(mapRespondError(t, data, _i18n));
          console.error('Supabase error:', data.error || data);
        }
      } else {
        setSubmitted(true);
        // Log en bewaar de response data (development only)
        if (import.meta.env.DEV) {
          console.log('Meeting bevestigd:', data);
        }
        setConfirmationInfo({
          cafe_name: data.cafe_name,
          cafe_address: data.cafe_address,
          selected_date: data.selected_date,
          selected_time: data.selected_time,
          ics_base64: data.ics_base64,
        });
      }
    } catch (err) {
      setErrorMsg(
        getRespondErrorMessage(
          t,
          'respond.genericError',
          err && typeof err === 'object' && 'message' in err
            ? (err as GenericError)
            : { message: String(err) },
        ),
      );
      console.error('Netwerkfout:', err);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="card bg-[#fff7f3] shadow-2xl p-8 max-w-lg w-full flex flex-col items-center">
          <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>☕️</span>
          <h2 className="text-2xl font-bold text-primary-700 mb-2 flex items-center gap-2">
            {_i18n.language === 'nl'
              ? 'Je koffiemomentje is bevestigd!'
              : 'Your coffee meetup is confirmed!'}
          </h2>
          <p className="text-lg text-gray-700 mb-6 text-center">
            {_i18n.language === 'nl'
              ? 'Je ontvangt een bevestiging per e-mail. Veel plezier!'
              : 'You will receive a confirmation by email. Enjoy your meetup!'}
          </p>
          {submitted && confirmationInfo && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 w-full text-center">
              <div className="font-semibold text-primary-700 mb-1">
                {_i18n.language === 'nl' ? 'Café' : 'Cafe'}: {confirmationInfo.cafe_name}
              </div>
              <div className="text-gray-600 mb-1">
                {_i18n.language === 'nl' ? 'Adres' : 'Address'}: {confirmationInfo.cafe_address}
              </div>
              <div className="text-gray-600 mb-1">
                {_i18n.language === 'nl' ? 'Datum' : 'Date'}: {confirmationInfo.selected_date}
              </div>
              <div className="text-gray-600 mb-1">
                {_i18n.language === 'nl' ? 'Tijd' : 'Time'}:{' '}
                {TIME_SLOT_LABELS[confirmationInfo.selected_time] || confirmationInfo.selected_time}
              </div>
              {/* Show all available times */}
              {invitation?.date_time_options && isDateTimeOptions(invitation.date_time_options) && (
                <div className="mt-2">
                  <div className="font-semibold text-primary-700 mb-1">
                    {_i18n.language === 'nl' ? 'Alle voorgestelde tijden:' : 'All suggested times:'}
                  </div>
                  <ul className="flex flex-wrap gap-2 justify-center">
                    {invitation.date_time_options.map((opt) =>
                      opt.times.map((time) => (
                        <li
                          key={opt.date + time}
                          className="bg-primary-50 px-3 py-1 rounded-full border border-primary-200 text-primary-800 text-sm"
                        >
                          {new Date(opt.date).toLocaleDateString(
                            _i18n.language === 'nl' ? 'nl-NL' : 'en-US',
                            { weekday: 'long', day: 'numeric', month: 'long' },
                          )}{' '}
                          – {TIME_SLOT_LABELS[time] || time}
                        </li>
                      )),
                    )}
                  </ul>
                </div>
              )}
              {confirmationInfo.ics_base64 && (
                <a
                  href={`data:text/calendar;base64,${confirmationInfo.ics_base64}`}
                  download="meeting.ics"
                  className="btn-secondary mt-4 inline-block"
                >
                  {_i18n.language === 'nl' ? 'Download agenda-item' : 'Download calendar file'}
                </a>
              )}
            </div>
          )}
          <div className="w-full flex flex-col items-center mt-2">
            <p className="mb-4 text-base text-primary-700 font-medium text-center">
              {_i18n.language === 'nl'
                ? 'Wil je zelf ook makkelijk afspraken maken, iemand weer eens zien of lokale tentjes supporten? Maak dan nu een account aan en zie je eigen meetings terug!'
                : 'Want to easily plan your own meetups, reconnect with friends, or support local cafés? Create an account now and see all your meetings in one place!'}
            </p>
            <a href="/signup" className="btn-secondary w-full mb-2">
              {_i18n.language === 'nl' ? 'Account aanmaken' : 'Create account'}
            </a>
            <button className="btn-primary w-full" onClick={() => (window.location.href = '/')}>
              {_i18n.language === 'nl' ? 'Terug naar home' : 'Back to home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <LoadingIndicator label={t('common.loading')} size="md" className="my-4" />
        <SkeletonLoader count={2} height="h-12" className="my-2" ariaLabel={t('common.loading')} />
      </div>
    );
  }
  if (error) {
    return <div className="max-w-2xl mx-auto text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <main className="max-w-2xl mx-auto px-2 sm:px-0 py-6">
      <div className="bg-primary-50 rounded-xl p-4 mb-4 text-center shadow text-primary-700 font-medium text-base">
        {t('respond.linkValid15min', 'This link is valid for 15 minutes.')}
      </div>
      <div className="card bg-primary-50 mb-6">
        <h2 className="text-xl font-semibold text-primary-600">
          {_i18n.language === 'nl' ? 'Café' : 'Cafe'}
        </h2>
        {cafe && cafe.image_url && (
          <img
            src={cafe.image_url}
            alt={cafe.name}
            className="w-full h-40 object-cover rounded-lg mb-2"
          />
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
      <h1 className="text-3xl font-bold text-primary-600 mb-2">{t('respond.title')}</h1>
      <p className="text-gray-600 mb-2">{t('respond.subtitle')}</p>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-md p-4 mb-8 text-yellow-900 text-base font-medium shadow-sm">
        <span role="img" aria-label="coffee">
          ☕️
        </span>{' '}
        {t('respond.explanation')}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-6 bg-white p-4 rounded-xl border border-primary-200">
          <h3 className="text-lg font-semibold text-primary-700 mb-4">
            {t('respond.chooseTime', 'When are you free?')}
          </h3>
          <div className="space-y-4">
            {Object.entries(availableTimes).map(([date, times]) => (
              <div key={date} className="bg-primary-50 p-3 rounded-lg">
                <p className="font-semibold text-primary-800 mb-2">
                  {new Date(date).toLocaleDateString(t('common.locale_code'), {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {times.map((time) => (
                    <label
                      key={`${date}-${time}`}
                      className={`block p-3 rounded-lg text-center cursor-pointer transition-all duration-150 border-2 ${
                        formData.selectedTime === `${date}-${time}`
                          ? 'bg-primary-600 text-white border-primary-700 shadow-md scale-105'
                          : 'bg-white hover:border-primary-400 border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedTime"
                        value={`${date}-${time}`}
                        checked={formData.selectedTime === `${date}-${time}`}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, selectedTime: e.target.value }))
                        }
                        className="sr-only"
                      />
                      <span className="font-medium text-sm">{t(`common.${time}`, time)}</span>
                      <span className="block text-xs opacity-80">
                        {TIME_SLOT_LABELS[time] || ''}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('respond.emailLabel')}
          </label>
          <input
            type="email"
            id="email"
            className="input-field mt-1"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            required
            autoFocus
            placeholder={t('respond.emailPlaceholder')}
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
            {t('respond.updatesOptIn')}
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t('common.loading') : t('respond.btn_confirm')}
        </button>
        <FormStatus
          status={loading ? 'loading' : submitted ? 'success' : errorMsg ? 'error' : 'idle'}
          message={confirmationInfo ? (t('respond.success') as string) || '' : errorMsg || ''}
        />
      </form>
    </main>
  );
};

export default Respond;
