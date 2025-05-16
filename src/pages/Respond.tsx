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

  const UPDATES_EMAIL_KEY = 'anemi-updates-email';

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      if (!token) {
        setError('Geen geldige uitnodiging gevonden.');
        setLoading(false);
        return;
      }
      // Haal invitation op
      const { data: invitation, error: invitationError } = await supabase.from('invitations').select('*').eq('token', token).single();
      if (invitationError || !invitation) {
        setError('Uitnodiging niet gevonden of verlopen.');
        setLoading(false);
        return;
      }
      setInvitation(invitation);
      // Toon cafe direct uit invitation
      setCafe({
        name: invitation.cafe_name,
        address: invitation.cafe_address
      });
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
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!formData.email) missing.push('email');
    if (!formData.selectedTime) missing.push('selectedTime');
    if (missing.length > 0) {
      setErrorMsg(
        t('common.errorMissingFields', {
          fields: missing
            .map((field) =>
              field === 'email'
                ? 'e-mailadres'
                : field === 'selectedTime'
                ? 'tijd'
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
      setErrorMsg("Uitnodiging niet gevonden.");
      setStatus("error");
      return;
    }
    // Sla email op als updates gewenst
    if (wantsUpdates) {
      localStorage.setItem(UPDATES_EMAIL_KEY, formData.email);
    } else {
      localStorage.removeItem(UPDATES_EMAIL_KEY);
    }
    console.log("Submit:", { token: invitation.token, email_b: formData.email, selected_date: formData.selectedTime.split('-')[0], selected_time: formData.selectedTime.split('-')[1] });
    try {
      const res = await fetch("https://bijyercgpgaheeoeumtv.supabase.co/functions/v1/send-meeting-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          token: invitation.token,
          email_b: formData.email,
          selected_date: formData.selectedTime.split('-')[0],
          selected_time: formData.selectedTime.split('-')[1]
        })
      });
      const data = await res.json();
      console.log("Function response:", data);
      if (!res.ok || !data.success) {
        setStatus("error");
        setErrorMsg(data.error || "Er ging iets mis. Probeer het opnieuw.");
      } else {
        setStatus("done");
        setSubmitted(true);
      }
    } catch (err) {
      console.error("Function error:", err);
      setStatus("error");
      setErrorMsg("Er ging iets mis. Probeer het opnieuw.");
    }
  };

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h2>☕ Jullie gaan binnenkort weer afspreken!</h2>
        <img src="/fun-coffee.gif" alt="Leuke GIF" style={{ maxWidth: "100%", borderRadius: "16px" }} />
        <p style={{ marginTop: "1rem" }}>
          De bevestiging is verstuurd naar beide e-mailadressen.
        </p>
        <button className="btn-primary mt-4" onClick={() => window.location.href = "/"}>Terug naar start</button>
        <div style={{ marginTop: "2rem" }}>
          <p>Wil je zelf een meeting aanmaken? Maak dan nu een account aan!</p>
          <a href="/signup" className="btn-secondary mt-2">Account aanmaken</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto text-center py-12">Loading...</div>;
  }
  if (error) {
    return <div className="max-w-2xl mx-auto text-center py-12 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {cafe && (
        <div className="card bg-primary-50 mb-6">
          <h2 className="text-xl font-semibold text-primary-600">Café</h2>
          <p className="text-gray-700 font-medium">{cafe.name}</p>
          <p className="text-gray-500">{cafe.address}</p>
        </div>
      )}
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
            Available Times
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
            id="updates"
            type="checkbox"
            checked={wantsUpdates}
            onChange={() => setWantsUpdates(v => !v)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="updates" className="ml-2 text-gray-700">
            Wil je updates ontvangen?
          </label>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={status === 'sending'}>
          {status === 'sending' ? 'Versturen...' : t('common.submit')}
        </button>
        {status === 'done' && <div className="text-green-600 mt-2">Uitnodiging bevestigd en mail verstuurd!</div>}
      </form>
    </div>
  );
};

export default Respond; 