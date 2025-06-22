import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingIndicator from '../components/LoadingIndicator';
import FormStatus from '../components/FormStatus';
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
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [availableTimes, setAvailableTimes] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationInfo, setConfirmationInfo] = useState<ConfirmationInfo | null>(null);
  const UPDATES_EMAIL_KEY = 'anemi-updates-email';

  useEffect(() => {
    const savedEmail = localStorage.getItem(UPDATES_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
    }

    const fetchInvitation = async () => {
      if (!token) {
        setError(t('respond.invalidInvitation'));
        setLoading(false);
        return;
      }

      try {
        const { data, error: invitationError } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', token)
          .single();

        if (invitationError || !data) {
          setError(t('respond.expiredOrMissing'));
          setLoading(false);
          return;
        }

        setInvitation(data);

        if (data.cafe_id) {
          const { data: cafeData } = await supabase
            .from('cafes')
            .select('*')
            .eq('id', data.cafe_id)
            .single();
          setCafe(cafeData);
        }

        const times: { [key: string]: string[] } = {};
        if (isDateTimeOptions(data.date_time_options)) {
          data.date_time_options.forEach((opt) => {
            if (opt.date && opt.times && opt.times.length > 0) {
              times[opt.date] = opt.times;
            }
          });
        }
        setAvailableTimes(times);
      } catch (err) {
        setError(t('respond.genericError'));
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimeSlot || !email || !invitation?.cafe_id) {
      setError(t('respond.missingInfo'));
      return;
    }

    const [date, time] = selectedTimeSlot.split('/');

    try {
      const { error: rpcError } = await supabase.functions.invoke('accept-meeting-invite', {
        body: {
          token,
          email,
          selected_date: date,
          selected_time: time,
          cafe_id: invitation.cafe_id,
        },
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (wantsUpdates) {
        localStorage.setItem(UPDATES_EMAIL_KEY, email);
      }

      setConfirmationInfo({
        cafe_name: cafe?.name || '',
        cafe_address: cafe?.address || '',
        selected_date: date,
        selected_time: time,
      });

      setSubmitted(true);
    } catch (err: unknown) {
      setError((err as Error).message || t('respond.genericError'));
    }
  };

  const handleTimeSlotClick = (date: string, time: string) => {
    const newSelectedTime = `${date}/${time}`;
    setSelectedTimeSlot(newSelectedTime === selectedTimeSlot ? null : newSelectedTime);
  };

  if (loading) return <LoadingIndicator />;
  if (error) return <FormStatus status="error" message={error} />;

  if (submitted && confirmationInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="card bg-[#fff7f3] shadow-2xl p-8 max-w-lg w-full flex flex-col items-center">
          <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>☕️</span>
          <h2 className="text-2xl font-bold text-primary-700 mb-2 flex items-center gap-2">
            {t('respond.confirmed')}
          </h2>
          <p className="text-lg text-gray-700 mb-6 text-center">{t('respond.confirmationEmail')}</p>
          {submitted && confirmationInfo && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 w-full text-center">
              <div className="font-semibold text-primary-700 mb-1">
                {t('respond.cafe')}: {confirmationInfo.cafe_name}
              </div>
              <div className="text-gray-600 mb-1">
                {t('respond.address')}: {confirmationInfo.cafe_address}
              </div>
              <div className="text-gray-600 mb-1">
                {t('respond.date')}: {confirmationInfo.selected_date}
              </div>
              <div className="text-gray-600 mb-1">
                {t('respond.time')}: {confirmationInfo.selected_time}
              </div>
              {/* Show all available times */}
              {invitation?.date_time_options && isDateTimeOptions(invitation.date_time_options) && (
                <div className="mt-2">
                  <div className="font-semibold text-primary-700 mb-1">
                    {t('respond.allSuggestedTimes')}
                  </div>
                  <ul className="flex flex-wrap gap-2 justify-center">
                    {invitation.date_time_options.map((opt) =>
                      opt.times.map((time) => (
                        <li
                          key={opt.date + time}
                          className="bg-primary-50 px-3 py-1 rounded-full border border-primary-200 text-primary-800 text-sm"
                        >
                          {new Date(opt.date).toLocaleDateString(t('common.locale_code'), {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                          {' - '}
                          {t(`common.${time}`, time)}
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
                  {t('respond.downloadCalendarFile')}
                </a>
              )}
            </div>
          )}
          <div className="w-full flex flex-col items-center mt-2">
            <p className="mb-4 text-base text-primary-700 font-medium text-center">
              {t('respond.createAccount')}
            </p>
            <a href="/signup" className="btn-secondary w-full mb-2">
              {t('respond.createAccountBtn')}
            </a>
            <button className="btn-primary w-full" onClick={() => (window.location.href = '/')}>
              {t('respond.backToHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-2 sm:px-0 py-6">
      <div className="bg-primary-50 rounded-xl p-4 mb-4 text-center shadow text-primary-700 font-medium text-base">
        {t('respond.linkValid15min')}
      </div>
      <div className="card bg-primary-50 mb-6">
        <h2 className="text-xl font-semibold text-primary-600">{t('respond.cafe')}</h2>
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
          <h3 className="text-lg font-semibold text-primary-700 mb-4">{t('respond.chooseTime')}</h3>
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
                        selectedTimeSlot === `${date}/${time}`
                          ? 'bg-primary-600 text-white border-primary-700 shadow-md scale-105'
                          : 'bg-white hover:border-primary-400 border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedTime"
                        value={`${date}/${time}`}
                        checked={selectedTimeSlot === `${date}/${time}`}
                        onChange={() => handleTimeSlotClick(date, time)}
                        className="sr-only"
                      />
                      <span className="font-medium text-sm">{t(`common.${time}`, time)}</span>
                      <span className="block text-xs opacity-80">{t(`common.${time}`, time)}</span>
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          status={loading ? 'loading' : submitted ? 'success' : error ? 'error' : 'idle'}
          message={confirmationInfo ? (t('respond.success') as string) || '' : error || ''}
        />
      </form>
    </main>
  );
};

export default Respond;
