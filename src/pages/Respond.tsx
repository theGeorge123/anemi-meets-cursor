import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Respond = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    selectedTime: '',
  });
  const [availableTimes, setAvailableTimes] = useState<{date: string, time: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cafe, setCafe] = useState<any>(null);
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [invitation, setInvitation] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationInfo, setConfirmationInfo] = useState<any>(null);

  const UPDATES_EMAIL_KEY = 'anemi-updates-email';

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      if (!token) {
        setError(t('respond.invalidInvitation'));
        setLoading(false);
        return;
      }
      // Haal invitation op
      const { data: invitation, error: invitationError } = await supabase.from('invitations').select('*').eq('token', token).single();
      if (invitationError || !invitation) {
        setError(t('respond.expiredOrMissing'));
        setLoading(false);
        return;
      }
      setInvitation(invitation);
      // Haal cafe details op via cafe_id
      if (invitation.cafe_id) {
        const { data: cafeData, error: cafeError } = await supabase.from('cafes').select('name, address, image_url').eq('id', invitation.cafe_id).single();
        if (!cafeError && cafeData) {
          setCafe({ name: cafeData.name, address: cafeData.address, image_url: cafeData.image_url });
        } else {
          setCafe(null);
        }
      } else if (invitation.cafe_name && invitation.cafe_address) {
        setCafe({ name: invitation.cafe_name, address: invitation.cafe_address });
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
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setWantsUpdates(true);
    }
  }, [location.search, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!formData.email) missing.push('email');
    if (!formData.selectedTime) missing.push('selectedTime');
    // Extra validatie op formaat selectedTime
    const lastDash = formData.selectedTime.lastIndexOf('-');
    const datePart = formData.selectedTime.substring(0, lastDash);
    const timePart = formData.selectedTime.substring(lastDash + 1);
    if (!datePart || !timePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart) || !['morning','afternoon','evening'].includes(timePart)) {
      setErrorMsg(t('respond.invalidDateFormat'));
      return;
    }
    if (missing.length > 0) {
      setErrorMsg(
        t('common.errorMissingFields', {
          fields: missing
            .map((field) =>
              field === 'email'
                ? t('common.email')
                : field === 'selectedTime'
                ? t('common.time')
                : field
            )
            .join(', ')
        })
      );
      return;
    }
    setErrorMsg("");
    setStatus("sending");
    if (!invitation) {
      setErrorMsg(t('respond.errorNoInvite'));
      setStatus("error");
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
        email_b: formData.email,
        selected_date: datePart,
        selected_time: timePart
      };
      if (invitation.cafe_id) {
        body.cafe_id = invitation.cafe_id;
      }
      const authKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      console.log('DEBUG: VITE_SUPABASE_ANON_KEY:', authKey);
      console.log('DEBUG: fetch headers:', {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authKey}`
      });
      console.log('DEBUG: fetch body:', body);
      const res = await fetch("https://bijyercgpgaheeoeumtv.supabase.co/functions/v1/send-meeting-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authKey}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatus("error");
        setErrorMsg(data.error || t('respond.genericError'));
        console.error("Supabase error:", data.error || data);
      } else {
        setStatus("done");
        setSubmitted(true);
        // Log en bewaar de response data
        console.log('Meeting bevestigd:', data);
        setConfirmationInfo({
          cafe_name: data.cafe_name,
          cafe_address: data.cafe_address,
          selected_date: data.selected_date,
          selected_time: data.selected_time
        });
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(t('respond.genericError'));
      console.error("Netwerkfout:", err);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="card bg-[#fff7f3] shadow-2xl p-8 max-w-lg w-full flex flex-col items-center">
          <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>☕️</span>
          <h2 className="text-2xl font-bold text-[#37474f] mb-2 flex items-center gap-2">
            {t('respond.meetupConfirmed')}
          </h2>
          <img src="/coffee-fun.gif" alt={t('respond.coffeeGifAlt')} style={{ maxWidth: 120, borderRadius: 16, margin: '1rem 0' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          <p className="text-lg text-gray-700 mb-6 text-center">
            {t('respond.emailSent')}
          </p>
          {confirmationInfo && (
            <div className="bg-white rounded-lg shadow p-4 mb-4 w-full text-center">
              <div className="font-semibold text-primary-700 mb-1">{t('common.cafe')}: {confirmationInfo.cafe_name}</div>
              <div className="text-gray-600 mb-1">{t('common.address')}: {confirmationInfo.cafe_address}</div>
              <div className="text-gray-600 mb-1">{t('common.date')}: {confirmationInfo.selected_date}</div>
              <div className="text-gray-600">{t('common.time')}: {confirmationInfo.selected_time}</div>
            </div>
          )}
          <button className="btn-primary w-full mb-3" onClick={() => window.location.href = "/"}>{t('common.backToHome')}</button>
          <div className="w-full flex flex-col items-center mt-2">
            <p className="mb-2">{t('respond.cta')}</p>
            <a href="/signup" className="btn-secondary w-full">{t('common.createAccount')}</a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto text-center py-12">{t('common.loading')}</div>;
  }
  if (error) {
    return <div className="max-w-2xl mx-auto text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card bg-primary-50 mb-6">
        <h2 className="text-xl font-semibold text-primary-600">{t('common.cafe')}</h2>
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
      <p className="text-gray-600 mb-8">
        {t('respond.subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && <div className="text-red-600 mb-2">{errorMsg}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            {t('respond.availableTimes')}
          </label>
          <div className="space-y-3">
            {availableTimes.map((time, idx) => (
              <label key={idx} className="flex items-center">
                <input
                  type="radio"
                  name="selectedTime"
                  value={`${time.date}-${time.time}`}
                  checked={formData.selectedTime === `${time.date}-${time.time}`}
                  onChange={(e) => setFormData(prev => ({ ...prev, selectedTime: e.target.value }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  required
                />
                <span className="ml-2 text-gray-700">
                  {new Date(time.date).toLocaleDateString()} - {t(`common.${time.time}`)}
                </span>
              </label>
            ))}
          </div>
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
            {t('respond.wantUpdates')}
          </label>
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={status === "sending"}
        >
          {status === "sending" ? t('respond.sending') : t('common.submit')}
        </button>
      </form>
    </div>
  );
};

export default Respond; 