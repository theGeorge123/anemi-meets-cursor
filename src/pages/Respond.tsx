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
  const { t } = useTranslation();
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
  const [status, setStatus] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
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
      const { data: invitation, error: invitationError } = await supabase.from('invitations').select('*').eq('token', token).maybeSingle();
      if (invitationError) {
        setError(t('respond.expiredOrMissing'));
        setLoading(false);
        return;
      }
      if (!invitation) {
        setError(t('respond.expiredOrMissing'));
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
    if (!formData.email) missing.push('email');
    if (!formData.selectedTime) missing.push('selectedTime');
    // Extra validatie op formaat selectedTime
    const lastDash = formData.selectedTime.lastIndexOf('-');
    const datePart = formData.selectedTime.substring(0, lastDash);
    const timePart = formData.selectedTime.substring(lastDash + 1);
    // Check cafe_id presence
    const cafeId = invitation?.cafe_id;
    if (!cafeId) missing.push('cafe_id');
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
                : field === 'cafe_id'
                ? t('common.cafe')
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
        selected_time: timePart,
        cafe_id: cafeId
      };
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
        // Herkenbare foutmeldingen netjes vertalen
        let msg = t('respond.genericError');
        const code = data.error_code || '';
        switch (code) {
          case 'missing_cafe_id':
            msg = t('common.errorMissingFields', { fields: t('common.cafe') });
            break;
          case 'missing_email':
            msg = t('common.errorMissingFields', { fields: t('common.email') });
            break;
          case 'authorization':
            msg = t('respond.errorSendMail');
            break;
          case 'expired_or_missing':
            msg = t('respond.expiredOrMissing');
            break;
          default:
            if (data && typeof data.error === 'string') {
              const err = data.error.toLowerCase();
              if (err.includes('missing cafe id')) {
                msg = t('common.errorMissingFields', { fields: t('common.cafe') });
              } else if (err.includes('missing email')) {
                msg = t('common.errorMissingFields', { fields: t('common.email') });
              } else if (err.includes('authorization')) {
                msg = t('respond.errorSendMail');
              } else if (err.includes('expired') || err.includes('not found')) {
                msg = t('respond.expiredOrMissing');
              }
            }
        }
        setErrorMsg(msg);
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
        // Redirect na succes
        setTimeout(() => {
          window.location.href = "/confirmed";
        }, 1200);
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
        {errorMsg && <FormStatus status="error" message={errorMsg} />}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            {t('respond.availableTimes')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableTimes.map((time, idx) => {
              const value = `${time.date}-${time.time}`;
              const isSelected = formData.selectedTime === value;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, selectedTime: value }))}
                  className={`w-full p-4 rounded-xl border-2 font-semibold text-lg shadow-sm flex flex-col items-center justify-center transition-all duration-150
                    ${isSelected ? 'border-primary-600 bg-primary-100 text-primary-800 scale-105 ring-2 ring-primary-300' : 'border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50'}`}
                  aria-pressed={isSelected}
                >
                  <span>{new Date(time.date).toLocaleDateString()}</span>
                  <span className="mt-1">{t(`common.${time.time}`)}</span>
                </button>
              );
            })}
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
            autoFocus
            placeholder={t('common.emailPlaceholder')}
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
            {t('respond.wantUpdates')}
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>{loading ? t('common.loading') : t('respond.cta')}</button>
        <FormStatus status={loading ? 'loading' : submitted ? 'success' : errorMsg ? 'error' : 'idle'} message={confirmationInfo ? t('respond.success') : errorMsg || undefined} />
      </form>
    </div>
  );
};

export default Respond; 