import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import LoadingIndicator from '../components/LoadingIndicator';

const UPDATES_EMAIL_KEY = 'anemi-updates-email';

// TypeScript interface voor typeveiligheid
interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Signup = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const steps = [t('signup.steps')[0], t('signup.steps')[1], t('signup.steps')[2], t('signup.overviewTitle')];
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SignupForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  // Helper voor sterke wachtwoordvalidatie
  const validatePassword = (pw: string) => {
    if (pw.length < 8) return t('common.passwordTooShort');
    if (!/[A-Z]/.test(pw)) return t('common.passwordNoUpper');
    if (!/[a-z]/.test(pw)) return t('common.passwordNoLower');
    if (!/[0-9]/.test(pw)) return t('common.passwordNoNumber');
    if (!/[!@#$%^&*(),.?":{}|<>\[\]\\/;'+=_-]/.test(pw)) return t('common.passwordNoSpecial');
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const pwError = validatePassword(form.password);
    if (pwError) {
      setError(pwError);
      setLoading(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t('signup.passwordsNoMatch'));
      setLoading(false);
      return;
    }
    // Probeer altijd te registreren, maar geef altijd dezelfde feedback
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name }
      }
    });
    if (signUpError) {
      let msg = t('signup.errorGeneric');
      // Gebruik error.code als die er is
      const code = signUpError.code || '';
      switch (code) {
        case 'user_already_exists':
        case 'email_exists':
          msg = t('signup.errorAlreadyRegistered');
          break;
        case 'email_address_invalid':
        case 'invalid_email':
          msg = t('common.error_invalid_email');
          break;
        case 'weak_password':
          msg = t('common.passwordTooShort');
          break;
        case 'over_email_send_rate_limit':
        case 'over_request_rate_limit':
          msg = t('signup.errorRateLimit');
          break;
        case 'signup_disabled':
          msg = t('signup.errorSignupDisabled');
          break;
        case 'validation_failed':
          msg = t('signup.errorValidationFailed');
          break;
        case 'unexpected_failure':
        case 'internal_server_error':
          msg = t('signup.errorServer');
          break;
        default:
          // Fallback op message string als code ontbreekt
          const errMsg = signUpError.message?.toLowerCase() || '';
          if (errMsg.includes('user already registered')) {
            msg = t('signup.errorAlreadyRegistered');
          } else if (errMsg.includes('invalid email')) {
            msg = t('common.error_invalid_email');
          } else if (errMsg.includes('weak password')) {
            msg = t('common.passwordTooShort');
          } else if (errMsg.includes('rate limit')) {
            msg = t('signup.errorRateLimit');
          } else if (errMsg.includes('password')) {
            msg = t('common.passwordNoSpecial');
          }
      }
      setError(msg);
        setLoading(false);
        return;
      }
      // Updates-subscribers opslaan als vinkje aanstaat
    if (data.user && wantsUpdates) {
        const { error: updatesError } = await supabase.from('updates_subscribers').upsert({ email: form.email });
        if (updatesError) {
          setError('Account aangemaakt, maar aanmelden voor updates is mislukt: ' + updatesError.message);
      }
    }
    if (wantsUpdates) {
      localStorage.setItem(UPDATES_EMAIL_KEY, form.email);
    }
    setSuccess('Account aangemaakt! Check je e-mail voor een bevestigingslink. Zo houden we het veilig en blijven spammers buiten. Je wordt doorgestuurd naar je accountpagina...');
    setLoading(false);
    setTimeout(() => navigate('/account'), 2000);
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
          form.password.length >= 8 &&
          form.confirmPassword.length >= 8 &&
          !validatePassword(form.password) &&
          form.password === form.confirmPassword
        );
      case 3:
        return true; // samenvatting
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
      <div className="flex justify-end mb-2">
        <button
          onClick={() => {
            const newLang = i18n.language === 'en' ? 'nl' : 'en';
            i18n.changeLanguage(newLang);
          }}
          className="px-4 py-2 rounded-full border-2 border-[#ff914d] bg-white text-primary-700 font-bold shadow hover:bg-[#ff914d] hover:text-white transition text-lg"
        >
          {i18n.language === 'en' ? 'NL' : 'EN'}
        </button>
      </div>
      <div className="bg-[#fff7f3] rounded-xl p-4 mb-4 text-center shadow text-primary-700 font-medium text-base">
        {t('common.freeAccountInfo')}
      </div>
      <h1 className="text-3xl font-bold text-primary-600 mb-8 text-center">{t('common.createAccount')}</h1>
      <div className="flex justify-center gap-2 mb-8 mt-6">
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
      <form onSubmit={step === steps.length - 1 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}
        className="space-y-4 bg-white/90 p-3 rounded-xl shadow-2xl border border-primary-100 flex flex-col justify-between mt-2">
        {step === 0 && (
          <div>
            <label htmlFor="signup-name" className="block text-lg font-medium text-gray-700 mb-2">
              <span className="text-2xl">😊</span> {t('signup.namePrompt')}
            </label>
            <input
              type="text"
              id="signup-name"
              className="input-field mt-1"
              value={form.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              required
              placeholder={t('common.name')}
              autoFocus
            />
          </div>
        )}
        {step === 1 && (
        <div>
            <label htmlFor="signup-email" className="block text-lg font-medium text-gray-700 mb-2">
              <span className="text-2xl">📧</span> {t('signup.emailPrompt')}
          </label>
          <input
            type="email"
            id="signup-email"
            className="input-field mt-1"
            value={form.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
            required
              placeholder={t('common.email')}
              autoFocus
          />
        </div>
        )}
        {step === 2 && (
        <div>
            <label htmlFor="signup-password" className="block text-lg font-medium text-gray-700 mb-2">
              <span className="text-2xl">🔒</span> {t('signup.passwordPrompt')}
          </label>
          <input
            type="password"
            id="signup-password"
              className="input-field mt-1 mb-4"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
              placeholder={t('common.password') + ' (min. 8, hoofdletter, cijfer, speciaal)'}
              autoFocus
            />
            <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
              <span className="text-lg">😅</span> {t('signup.confirmPasswordPrompt')}
            </label>
            <input
              type="password"
              id="signup-confirm-password"
              className="input-field mt-1"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
              placeholder={t('signup.confirmPassword')}
            />
            {/* Toon wachtwoordvalidatie live */}
            {form.password && validatePassword(form.password) && (
              <div className="text-red-500 text-sm mt-2">{validatePassword(form.password)}</div>
            )}
            {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
              <div className="text-red-500 text-sm mt-2">{t('signup.passwordsNoMatch')}</div>
            )}
          </div>
        )}
        {step === 3 && (
          <div>
            <h1 className="text-3xl font-bold text-primary-600 mb-8 text-center">{t('common.createAccount')}</h1>
            <h2 className="text-xl font-bold mb-4">{t('signup.overviewTitle')}</h2>
            <div className="mb-4">
              <div><b>{t('common.name')}:</b> {form.name}</div>
              <div><b>{t('common.email')}:</b> {form.email}</div>
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
            {t('signup.updatesCta')}
          </label>
        </div>
          </div>
        )}
        {step === 3 && (
        <button
          type="submit"
            className={`btn-primary w-full flex items-center justify-center py-2 text-base rounded-xl font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading || !isStepValid()}
        >
          {loading ? (
            <LoadingIndicator size="sm" label={t('common.loading')} className="mr-2" />
          ) : null}
          {loading ? t('common.loading') : t('common.createAccount')}
        </button>
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
              className={`flex-1 btn-primary py-2 text-base rounded-xl font-medium ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      <div className="text-center mt-10">
        <h2 className="text-xl font-bold text-primary-700 mb-2">{t('common.testimonialsTitle')}</h2>
        <div className="italic text-gray-700 bg-white/70 rounded-xl p-4 shadow max-w-xs mx-auto">
          {t('common.testimonial1')}
        </div>
      </div>
    </div>
  );
};

export default Signup;