import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import Toast from '../components/Toast';

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
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1));

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
    setLoading(true);
    const pwError = validatePassword(form.password);
    if (pwError) {
      setLoading(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setLoading(false);
      return;
    }
    // Probeer altijd te registreren, maar geef altijd dezelfde feedback
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name }
      }
    });
    if (signUpError) {
      // Gebruik error.code als die er is
      const code = signUpError.code || '';
      switch (code) {
        case 'user_already_exists':
        case 'email_exists':
          setLoading(false);
          return;
        case 'email_address_invalid':
        case 'invalid_email':
          setLoading(false);
          return;
        case 'weak_password':
          setLoading(false);
          return;
        case 'over_email_send_rate_limit':
        case 'over_request_rate_limit':
          setLoading(false);
          return;
        case 'signup_disabled':
          setLoading(false);
          return;
        case 'validation_failed':
          setLoading(false);
          return;
        case 'unexpected_failure':
        case 'internal_server_error':
          setLoading(false);
          return;
        default:
          // Fallback op message string als code ontbreekt
          const errMsg = signUpError.message?.toLowerCase() || '';
          if (errMsg.includes('user already registered')) {
            setLoading(false);
            return;
          } else if (errMsg.includes('invalid email')) {
            setLoading(false);
            return;
          } else if (errMsg.includes('weak password')) {
            setLoading(false);
            return;
          } else if (errMsg.includes('rate limit')) {
            setLoading(false);
            return;
          } else if (errMsg.includes('password')) {
            setLoading(false);
            return;
          }
      }
    }
    setLoading(false);
    setShowSuccess(true);
    setTimeout(() => navigate('/account'), 2000);
  };

  // Prevent iOS auto-zoom on input focus
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
        {t('freeAccountInfo')}
      </div>
      <h1 className="text-3xl font-bold text-primary-600 mb-8 text-center">{t('createAccount')}</h1>
      <div className="flex justify-center gap-2 mb-8 mt-6">
        {(t('signup.steps', { returnObjects: true }) as string[]).map((label, idx) => (
          <div
            key={label}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
              ${step === idx ? 'bg-[#ff914d] text-white scale-110 shadow-lg' : 'bg-[#b2dfdb] text-primary-700 opacity-60'}`}
          >
            {label}
          </div>
        ))}
      </div>
      <form onSubmit={step === steps.length - 1 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}
        className="space-y-4 bg-white/90 p-3 rounded-xl shadow-2xl border border-primary-100 flex flex-col justify-between mt-2 px-2 sm:px-0">
        {step === 0 && (
          <div>
            <label htmlFor="signup-name" className="block text-lg font-medium text-gray-700 mb-2">
              <span className="text-2xl">😊</span> {t('signup.namePrompt')}
            </label>
            <input
              type="text"
              id="signup-name"
              className="input-field mt-1 min-h-[48px] text-base"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              autoFocus
              placeholder={t('createAccount')}
              inputMode="text"
              autoComplete="name"
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
              className="input-field mt-1 min-h-[48px] text-base"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              placeholder={t('signup.emailPlaceholder')}
              inputMode="email"
              autoComplete="email"
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
              className="input-field mt-1 min-h-[48px] text-base"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              placeholder={t('signup.passwordPlaceholder')}
              inputMode="text"
              autoComplete="new-password"
            />
          </div>
        )}
        {step === 3 && (
          <div>
            <label htmlFor="signup-confirm-password" className="block text-lg font-medium text-gray-700 mb-2">
              <span className="text-2xl">🔒</span> {t('signup.confirmPasswordPrompt')}
            </label>
            <input
              type="password"
              id="signup-confirm-password"
              className="input-field mt-1 min-h-[48px] text-base"
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              required
              placeholder={t('signup.confirmPasswordPlaceholder')}
              inputMode="text"
              autoComplete="new-password"
            />
          </div>
        )}
        <button
          type="submit"
          className="btn-primary w-full min-h-[48px] text-base mt-2"
          disabled={loading}
        >
          {step === steps.length - 1 ? t('signup.submit') : t('next')}
        </button>
        {showSuccess && (
          <Toast
            message={t('toast.signupSuccess')}
            type="success"
            onClose={() => setShowSuccess(false)}
          />
        )}
      </form>
      <div className="text-center mt-6">
        <button
          className="text-primary-600 underline hover:text-primary-800 text-sm"
          onClick={() => navigate('/login')}
        >
          {t('alreadyHaveAccount')}
        </button>
      </div>
      <div className="text-center mt-10">
        <h2 className="text-xl font-bold text-primary-700 mb-2">{t('testimonialsTitle')}</h2>
        <div className="italic text-gray-700 bg-white/70 rounded-xl p-4 shadow max-w-xs mx-auto">
          {t('testimonial1')}
        </div>
      </div>
    </div>
  );
};

export default Signup;