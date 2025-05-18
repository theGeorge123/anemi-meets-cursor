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

const EMOJI_OPTIONS = ['😃','😎','🧑‍🎤','🦄','🐱','🐶','☕️','🌈','💡','❤️'];
const UPDATES_EMAIL_KEY = 'anemi-updates-email';

const steps = [
  'Naam',
  'E-mail',
  'Wachtwoord',
  'Geslacht',
  'Emoji',
  'Updates',
];

const Signup = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    emoji: '',
  });
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    if (form.password !== form.confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      setLoading(false);
      return;
    }
    // Probeer altijd te registreren, maar geef altijd dezelfde feedback
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (signUpError) {
      setError('Registratie mislukt. Probeer het later opnieuw.');
      setLoading(false);
      return;
    }
    // Profiel opslaan in Supabase
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: form.email,
        full_name: form.name,
        gender: form.gender,
        emoji: form.emoji,
      });
      if (profileError) {
        setError('Account aangemaakt, maar profiel opslaan is mislukt.');
        setLoading(false);
        return;
      }
      // Updates-subscribers opslaan als vinkje aanstaat
      if (wantsUpdates) {
        await supabase.from('updates_subscribers').upsert({ email: form.email });
      }
    }
    if (wantsUpdates) {
      localStorage.setItem(UPDATES_EMAIL_KEY, form.email);
    }
    setSuccess('Als je al een account hebt, controleer je e-mail voor een bevestigingslink of probeer in te loggen.');
    setLoading(false);
    setTimeout(() => navigate('/login'), 3000);
  };

  // Validatie per stap
  const isStepValid = () => {
    switch (step) {
      case 0:
        return form.name.trim().length > 1;
      case 1:
        return /.+@.+\..+/.test(form.email);
      case 2:
        return (
          form.password.length >= 6 &&
          form.confirmPassword.length >= 6 &&
          form.password === form.confirmPassword
        );
      case 3:
        return true; // Geslacht is optioneel
      case 4:
        return !!form.emoji;
      case 5:
        return true;
      default:
        return false;
    }
  };

  // Automatisch door naar volgende stap als veld is ingevuld (behalve wachtwoord en emoji)
  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-primary-600 mb-8 text-center">{t('common.createAccount')}</h1>
      <div className="flex justify-center gap-2 mb-6">
        {steps.map((label, idx) => (
          <div
            key={label}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
              ${step === idx ? 'bg-[#ff914d] text-white scale-110 shadow-lg' : 'bg-[#b2dfdb] text-primary-700 opacity-60'}`}
          >
            {idx + 1}
          </div>
        ))}
      </div>
      <form onSubmit={step === steps.length - 1 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-8 bg-white/70 p-6 rounded-2xl shadow min-h-[320px] flex flex-col justify-between">
        {step === 0 && (
          <div>
            <label htmlFor="signup-name" className="block text-lg font-medium text-gray-700 mb-2">
              <span className="text-2xl">😊</span> Hoe leuk dat je hier bent! Maar wat is je naam eigenlijk?
            </label>
            <input
              type="text"
              id="signup-name"
              className="input-field mt-1"
              value={form.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              required
              placeholder="Naam"
              autoFocus
            />
          </div>
        )}
        {step === 1 && (
          <div>
            <label htmlFor="signup-email" className="block text-lg font-medium text-gray-700 mb-2">
              <span className="text-2xl">📧</span> En op welk e-mailadres mogen we je helpen connecten?
            </label>
            <input
              type="email"
              id="signup-email"
              className="input-field mt-1"
              value={form.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              required
              placeholder="E-mail"
              autoFocus
            />
          </div>
        )}
        {step === 2 && (
          <div>
            <label htmlFor="signup-password" className="block text-lg font-medium text-gray-700 mb-2">
              <span className="text-2xl">🔒</span> Met welk wachtwoord wil je dit account beveiligen?
            </label>
            <input
              type="password"
              id="signup-password"
              className="input-field mt-1 mb-4"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
              placeholder="Wachtwoord (min. 6 tekens)"
              autoFocus
            />
            <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              <span className="text-lg">😅</span> Sorry, maar we moeten toch even checken of je je wachtwoord goed hebt geschreven.
            </label>
            <input
              type="password"
              id="signup-confirm-password"
              className="input-field mt-1"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
              placeholder="Bevestig wachtwoord"
            />
            {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
              <div className="text-red-500 text-sm mt-2">Oeps, wachtwoorden komen niet overeen!</div>
            )}
          </div>
        )}
        {step === 3 && (
          <div>
            <label htmlFor="gender" className="block text-lg font-medium text-gray-700 mb-2">
              Je hoeft je geslacht niet te zeggen, maar het is wel leuk om te weten! <span className="text-lg">😊</span>
            </label>
            <select
              id="gender"
              className="input-field mt-1"
              value={form.gender}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
            >
              <option value="">{t('common.selectOption')}</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
        {step === 4 && (
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Kies een emoji als profielfoto! <span className="text-2xl">🎨</span>
            </label>
            <div className="flex flex-wrap justify-center gap-2 mb-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  className={`text-2xl px-3 py-2 rounded-full border-2 transition-all duration-150 ${form.emoji === emoji ? 'border-[#ff914d] bg-[#ff914d]/10' : 'border-transparent hover:border-[#b2dfdb]'}`}
                  onClick={() => setForm((prev) => ({ ...prev, emoji }))}
                  aria-label={`Kies emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {!form.emoji && <div className="text-sm text-gray-500 mt-2">Kies je favoriet!</div>}
          </div>
        )}
        {step === 5 && (
          <div>
            <div className="mb-6 bg-[#fff7f3] rounded-2xl p-4 shadow text-left">
              <h2 className="text-lg font-bold text-primary-700 mb-2 flex items-center gap-2">📝 Overzicht van je gegevens</h2>
              <ul className="space-y-1 text-base">
                <li><span className="font-semibold">Naam:</span> {form.name || <span className="text-gray-400">-</span>}</li>
                <li><span className="font-semibold">E-mail:</span> {form.email || <span className="text-gray-400">-</span>}</li>
                <li><span className="font-semibold">Geslacht:</span> {form.gender ? GENDER_OPTIONS.find(opt => opt.value === form.gender)?.label : <span className="text-gray-400">-</span>}</li>
                <li><span className="font-semibold">Emoji:</span> {form.emoji ? <span className="text-2xl align-middle">{form.emoji}</span> : <span className="text-gray-400">-</span>}</li>
                <li><span className="font-semibold">Updates ontvangen:</span> {wantsUpdates ? <span className="text-green-600 font-semibold">Ja 🎉</span> : <span className="text-gray-400">Nee</span>}</li>
              </ul>
            </div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="updates-checkbox"
                checked={wantsUpdates}
                onChange={() => setWantsUpdates((v) => !v)}
                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
              />
              <label htmlFor="updates-checkbox" className="text-sm text-gray-700 select-none">
                Wil je meegroeien met deze startup en zien waar we mee bezig zijn? Klik dan hier!
              </label>
            </div>
            <button
              type="submit"
              className={`btn-primary w-full flex items-center justify-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading || !isStepValid()}
            >
              {loading ? <span className="animate-spin mr-2 w-5 h-5 border-2 border-white border-t-[#ff914d] rounded-full inline-block"></span> : null}
              {t('common.createAccount')}
            </button>
          </div>
        )}
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
        <div className="flex justify-between mt-8">
          {step > 0 && step < steps.length && (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-2 rounded-2xl font-medium bg-gray-200 text-gray-700 hover:scale-105 transition"
            >
              Terug
            </button>
          )}
          {step < steps.length - 1 && (
            <button
              type="submit"
              className={`px-6 py-2 rounded-2xl font-medium bg-[#1573ff] text-white ml-2 hover:scale-105 transition ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!isStepValid()}
            >
              Volgende
            </button>
          )}
        </div>
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