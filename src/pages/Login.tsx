import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingIndicator from '../components/LoadingIndicator';
import FormStatus from '../components/FormStatus';
import Toast from '../components/Toast';
import ErrorBoundary from '../components/ErrorBoundary';

const UPDATES_EMAIL_KEY = 'anemi-updates-email';

const Login = () => {
  const { t } = useTranslation(['login', 'common']);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Prefill email if saved
    const savedEmail = localStorage.getItem(UPDATES_EMAIL_KEY);
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
    }
  }, []);

  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      const content = viewport.getAttribute('content');
      if (content && !content.includes('maximum-scale')) {
        viewport.setAttribute('content', content + ', maximum-scale=1.0');
      }
    }
  }, []);

  const getErrorMessage = (key: string, error: any) => {
    const translated = t(key);
    if (translated === key) {
      return `Error: ${error?.message || 'Unknown error'}`;
    }
    return translated;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    if (error) {
      let msg = getErrorMessage('error_generic', error);
      const code = error.code || '';
      switch (code) {
        case 'user_not_found':
          msg = getErrorMessage('error_user_not_found', error);
          break;
        case 'invalid_login_credentials':
          msg = getErrorMessage('error_invalid_password', error);
          break;
        case 'email_address_invalid':
        case 'invalid_email':
          msg = getErrorMessage('error_invalid_email', error);
          break;
        case 'user_banned':
          msg = getErrorMessage('error_user_banned', error);
          break;
        case 'email_not_confirmed':
          msg = getErrorMessage('error_email_not_confirmed', error);
          break;
        case 'over_email_send_rate_limit':
        case 'over_request_rate_limit':
          msg = getErrorMessage('errorRateLimit', error);
          break;
        default:
          const errMsg = error.message?.toLowerCase() || '';
          if (errMsg.includes('invalid login credentials')) {
            msg = getErrorMessage('error_invalid_password', error);
          } else if (errMsg.includes('user not found')) {
            msg = getErrorMessage('error_user_not_found', error);
          } else if (errMsg.includes('email')) {
            msg = getErrorMessage('error_invalid_email', error);
          } else if (errMsg.includes('banned')) {
            msg = getErrorMessage('error_user_banned', error);
          } else if (errMsg.includes('not confirmed')) {
            msg = getErrorMessage('error_email_not_confirmed', error);
          } else if (errMsg.includes('rate limit')) {
            msg = getErrorMessage('errorRateLimit', error);
          }
      }
      setError(msg);
    } else {
      setShowSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1200);
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail || formData.email);
    if (error) {
      let msg = getErrorMessage('reset_error_generic', error);
      const code = error.code || '';
      switch (code) {
        case 'user_not_found':
          msg = getErrorMessage('error_user_not_found', error);
          break;
        case 'email_address_invalid':
        case 'invalid_email':
          msg = getErrorMessage('error_invalid_email', error);
          break;
        case 'over_email_send_rate_limit':
        case 'over_request_rate_limit':
          msg = getErrorMessage('errorRateLimit', error);
          break;
        default:
          const errMsg = error.message?.toLowerCase() || '';
          if (errMsg.includes('user not found')) {
            msg = getErrorMessage('error_user_not_found', error);
          } else if (errMsg.includes('invalid email')) {
            msg = getErrorMessage('error_invalid_email', error);
          } else if (errMsg.includes('rate limit')) {
            msg = getErrorMessage('errorRateLimit', error);
          }
      }
      setResetMsg(msg);
    } else {
      setResetMsg(t('reset_success'));
    }
    setResetLoading(false);
  };

  return (
    <main className="max-w-md mx-auto px-2 sm:px-0 py-6">
      <h1 className="mobile-heading text-primary-600 mb-6 text-center">
        {t('title')}
      </h1>
      <div className="bg-[#fff7f3] rounded-2xl shadow p-4 sm:p-6 mb-6 text-center">
        <div className="text-2xl mb-2">👋✨</div>
        <div className="text-lg font-semibold text-primary-700 mb-1">{t('welcomeBack')}</div>
        <div className="text-gray-700 text-base">{t('welcomeDesc')}</div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 bg-white/90 p-4 sm:p-6 rounded-xl shadow-2xl border border-primary-100 flex flex-col justify-between">
        <div>
          <label htmlFor="email" className="block mobile-text font-medium text-gray-700 mb-2">
            {t('email')}
          </label>
          <input
            type="email"
            id="email"
            className="input-field mt-1 min-h-[48px] text-base"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
            autoFocus
            placeholder={t('emailPlaceholder')}
            inputMode="email"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block mobile-text font-medium text-gray-700 mb-2">
            {t('password')}
          </label>
          <input
            type="password"
            id="password"
            className="input-field mt-1 min-h-[48px] text-base"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
            placeholder={t('passwordPlaceholder')}
            inputMode="text"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="text-primary-600 underline text-xs mt-2 ml-1 hover:text-primary-800"
            onClick={() => setShowReset(v => !v)}
          >
            {t('forgotPassword')}
          </button>
        </div>

        {showReset && (
          <form onSubmit={handlePasswordReset} className="mt-2 space-y-2 bg-white/80 p-3 rounded-xl border border-primary-100">
            <input
              type="email"
              className="input-field"
              placeholder="Jouw e-mailadres"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn-secondary w-full flex items-center justify-center py-2 text-base rounded-xl font-medium"
              disabled={resetLoading}
            >
              {resetLoading ? (
                <LoadingIndicator size="sm" label={t('common.loading')} className="mr-2" />
              ) : null}
              {resetLoading ? t('common.loading') : t('forgotPassword')}
            </button>
            {resetMsg && <div className="text-xs mt-1 text-green-700">{resetMsg}</div>}
          </form>
        )}

        <FormStatus status={loading ? 'loading' : error ? 'error' : 'idle'} message={error || undefined} />

        <button
          type="submit"
          className="btn-primary w-full min-h-[48px] text-base mt-2"
          disabled={loading}
        >
          {t('title')}
        </button>
      </form>

      <div className="text-center mt-6">
        <button
          className="text-primary-600 underline hover:text-primary-800 text-sm"
          onClick={() => navigate('/signup')}
        >
          {t('noAccountCta')}
        </button>
      </div>

      {showSuccess && (
        <Toast
          message={t('toast.loginSuccess')}
          type="success"
          onClose={() => setShowSuccess(false)}
        />
      )}

      {error && <div className="text-red-600 text-sm mt-2" aria-live="assertive">{error}</div>}
    </main>
  );
};

const LoginPageWithBoundary = () => (
  <ErrorBoundary>
    <Login />
  </ErrorBoundary>
);

export default LoginPageWithBoundary; 