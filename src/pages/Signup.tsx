import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';

const GENDER_OPTIONS = [
  { value: 'man', label: 'Man' },
  { value: 'vrouw', label: 'Vrouw' },
  { value: 'anders', label: 'Anders' },
  { value: 'wil_niet_zeggen', label: 'Wil ik niet zeggen' },
];

const UPDATES_EMAIL_KEY = 'anemi-updates-email';

const Signup = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({
    email: '',
    password: '',
    gender: '',
  });
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    // Probeer altijd te registreren, maar geef altijd dezelfde feedback
    await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    // Profiel alleen aanmaken als registratie succesvol is (optioneel, kan ook weggelaten worden)
    // if (data.user) {
    //   await supabase.from('profiles').upsert({
    //     id: data.user.id,
    //     email: form.email,
    //     full_name: '',
    //     bio: '',
    //     gender: form.gender,
    //   });
    // }
    if (wantsUpdates) {
      localStorage.setItem(UPDATES_EMAIL_KEY, form.email);
    }
    setSuccess('Als je al een account hebt, controleer je e-mail voor een bevestigingslink of probeer in te loggen.');
    setTimeout(() => navigate('/login'), 3000);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-primary-600 mb-8 text-center">{t('common.createAccount')}</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white/70 p-6 rounded-2xl shadow">
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
            {t('common.email')}
          </label>
          <input
            type="email"
            id="signup-email"
            className="input-field mt-1"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
            {t('common.password')}
          </label>
          <input
            type="password"
            id="signup-password"
            className="input-field mt-1"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
            {t('common.gender')}
          </label>
          <select
            id="gender"
            className="input-field mt-1"
            value={form.gender}
            onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
            required
          >
            <option value="">{t('common.selectOption')}</option>
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="updates-checkbox"
            checked={wantsUpdates}
            onChange={() => setWantsUpdates((v) => !v)}
            className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
          />
          <label htmlFor="updates-checkbox" className="text-sm text-gray-700 select-none">
            {t('common.updatesOptIn')}
          </label>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <button type="submit" className="btn-primary w-full">{t('common.createAccount')}</button>
      </form>
      <div className="text-center mt-6">
        <button
          className="text-primary-600 underline hover:text-primary-800 text-sm"
          onClick={() => navigate('/login')}
        >
          {t('common.alreadyHaveAccount')}
        </button>
      </div>
    </div>
  );
};

export default Signup; 