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
  const steps = t('signup.steps', { returnObjects: true }) as string[];
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<SignupForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});

  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1));

  // Helper voor sterke wachtwoordvalidatie
  const validatePassword = (pw: string) => {
    if (pw.length < 8) return i18n.language === 'nl' ? 'Wachtwoord moet minstens 8 tekens zijn!' : 'Password must be at least 8 characters!';
    if (!/[A-Z]/.test(pw)) return i18n.language === 'nl' ? 'Gebruik minstens één hoofdletter!' : 'Use at least one capital letter!';
    if (!/[a-z]/.test(pw)) return i18n.language === 'nl' ? 'Gebruik minstens één kleine letter!' : 'Use at least one lowercase letter!';
    if (!/[0-9]/.test(pw)) return i18n.language === 'nl' ? 'Voeg een cijfer toe!' : 'Add a number!';
    if (!/[!@#$%^&*(),.?":{}|<>\[\]\\/;'+=_-]/.test(pw)) return i18n.language === 'nl' ? 'Voeg een speciaal teken toe!' : 'Add a special character!';
    return null;
  };

  const validateEmail = (email: string) => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return t('signup.emailInvalid', 'Invalid email address');
    return null;
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!form.name.trim()) newErrors.name = t('signup.nameRequired', 'Name is required');
    const emailError = validateEmail(form.email);
    if (emailError) newErrors.email = emailError;
    const pwError = validatePassword(form.password);
    if (pwError) newErrors.password = pwError;
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = t('signup.passwordMismatch', 'Passwords do not match');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof SignupForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(errs => ({ ...errs, [field]: undefined }));
  };

  const getErrorMessage = (key: string, error: any) => {
    const translated = t(key);
    if (translated === key) {
      return `Error: ${error?.message || 'Unknown error'}`;
    }
    return translated;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
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
          setErrors(errs => ({ ...errs, email: getErrorMessage('signup.userAlreadyExists', signUpError) }));
          setLoading(false);
          return;
        case 'email_address_invalid':
        case 'invalid_email':
          setErrors(errs => ({ ...errs, email: getErrorMessage('signup.invalidEmail', signUpError) }));
          setLoading(false);
          return;
        case 'weak_password':
          setErrors(errs => ({ ...errs, password: getErrorMessage('signup.weakPassword', signUpError) }));
          setLoading(false);
          return;
        case 'over_email_send_rate_limit':
        case 'over_request_rate_limit':
          setErrors(errs => ({ ...errs, email: getErrorMessage('signup.rateLimit', signUpError) }));
          setLoading(false);
          return;
        case 'signup_disabled':
          setErrors(errs => ({ ...errs, email: getErrorMessage('signup.disabled', signUpError) }));
          setLoading(false);
          return;
        case 'validation_failed':
          setErrors(errs => ({ ...errs, email: getErrorMessage('signup.validationFailed', signUpError) }));
          setLoading(false);
          return;
        case 'unexpected_failure':
        case 'internal_server_error':
          setErrors(errs => ({ ...errs, email: getErrorMessage('signup.internalError', signUpError) }));
          setLoading(false);
          return;
        default:
          setErrors(errs => ({ ...errs, email: getErrorMessage('signup.unknownError', signUpError) }));
            setLoading(false);
            return;
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
    <main className="max-w-md mx-auto px-2 sm:px-0 py-6">
      <div className="bg-[#fff7f3] rounded-xl p-4 mb-4 text-center shadow text-primary-700 font-medium text-base">
        {t('freeAccountInfo', 'Create a free account to get started!')}
      </div>
      <h1 className="mobile-heading text-primary-600 mb-8 text-center">{t('createAccount', 'Create Account')}</h1>
      <div className="flex justify-center gap-2 mb-8 mt-6">
        {steps.map((label, idx) => (
          <div
            key={label}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
              ${step === idx ? 'bg-accent-500 text-white scale-110 shadow-lg' : 'bg-primary-100 text-primary-700 opacity-60'}`}
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
              <span className="text-2xl">😊</span> {t('signup.namePrompt', "We're glad you're here! What should we call you?")}
            </label>
            <input
              type="text"
              id="signup-name"
              className={`input-field mt-1 min-h-[48px] text-base${errors.name ? ' border-red-500' : ''}`}
              value={form.name}
              onChange={handleInputChange('name')}
              required
              autoFocus
              placeholder={t('signup.namePlaceholder', 'Your name')}
              inputMode="text"
              autoComplete="name"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1" aria-live="assertive">{errors.name}</p>}
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
              className={`input-field mt-1 min-h-[48px] text-base${errors.email ? ' border-red-500' : ''}`}
              value={form.email}
              onChange={handleInputChange('email')}
              required
              placeholder={t('signup.emailPlaceholder')}
              inputMode="email"
              autoComplete="email"
            />
            {errors.email && <p className="text-red-600 text-sm mt-1" aria-live="assertive">{errors.email}</p>}
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
              className={`input-field mt-1 min-h-[48px] text-base${errors.password ? ' border-red-500' : ''}`}
              value={form.password}
              onChange={handleInputChange('password')}
              required
              placeholder={t('signup.passwordPlaceholder')}
              inputMode="text"
              autoComplete="new-password"
            />
            {errors.password && <p className="text-red-600 text-sm mt-1" aria-live="assertive">{errors.password}</p>}
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
              className={`input-field mt-1 min-h-[48px] text-base${errors.confirmPassword ? ' border-red-500' : ''}`}
              value={form.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              required
              placeholder={t('signup.confirmPasswordPlaceholder')}
              inputMode="text"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="text-red-600 text-sm mt-1" aria-live="assertive">{errors.confirmPassword}</p>}
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
      <div className="mt-4 text-center text-primary-600">
        {t('alreadyHaveAccount', 'Already have an account?')}
      </div>
      <div className="text-center mt-10">
        <h2 className="text-xl font-bold text-primary-700 mb-2">{t('testimonialsTitle')}</h2>
        <div className="italic text-gray-700 bg-white/70 rounded-xl p-4 shadow max-w-xs mx-auto">
          {t('testimonial1')}
        </div>
      </div>
    </main>
  );
};

export default Signup;