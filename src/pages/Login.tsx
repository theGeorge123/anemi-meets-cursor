import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingIndicator from '../components/LoadingIndicator';

const UPDATES_EMAIL_KEY = 'anemi-updates-email';

const Login = () => {
  const { t } = useTranslation();
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

  useEffect(() => {
    // Prefill email if saved
    const savedEmail = localStorage.getItem(UPDATES_EMAIL_KEY);
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    if (error) {
      let msg = t('login.error_generic');
      const code = error.code || '';
      switch (code) {
        case 'user_not_found':
          msg = t('login.error_user_not_found');
          break;
        case 'invalid_login_credentials':
          msg = t('login.error_invalid_password');
          break;
        case 'email_address_invalid':
        case 'invalid_email':
          msg = t('login.error_invalid_email');
          break;
        case 'user_banned':
          msg = t('login.error_user_banned');
          break;
        case 'email_not_confirmed':
          msg = t('login.error_email_not_confirmed');
          break;
        case 'over_email_send_rate_limit':
        case 'over_request_rate_limit':
          msg = t('login.errorRateLimit');
          break;
        default:
          const errMsg = error.message?.toLowerCase() || '';
          if (errMsg.includes('invalid login credentials')) {
            msg = t('login.error_invalid_password');
          } else if (errMsg.includes('user not found')) {
            msg = t('login.error_user_not_found');
          } else if (errMsg.includes('email')) {
            msg = t('login.error_invalid_email');
          } else if (errMsg.includes('banned')) {
            msg = t('login.error_user_banned');
          } else if (errMsg.includes('not confirmed')) {
            msg = t('login.error_email_not_confirmed');
          } else if (errMsg.includes('rate limit')) {
            msg = t('login.errorRateLimit');
          }
      }
      setError(msg);
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail || formData.email);
    if (error) {
      let msg = t('login.reset_error_generic');
      const code = error.code || '';
      switch (code) {
        case 'user_not_found':
          msg = t('login.error_user_not_found');
          break;
        case 'email_address_invalid':
        case 'invalid_email':
          msg = t('login.error_invalid_email');
          break;
        case 'over_email_send_rate_limit':
        case 'over_request_rate_limit':
          msg = t('login.errorRateLimit');
          break;
        default:
          const errMsg = error.message?.toLowerCase() || '';
          if (errMsg.includes('user not found')) {
            msg = t('login.error_user_not_found');
          } else if (errMsg.includes('invalid email')) {
            msg = t('login.error_invalid_email');
          } else if (errMsg.includes('rate limit')) {
            msg = t('login.errorRateLimit');
          }
      }
      setResetMsg(msg);
    } else {
      setResetMsg(t('login.reset_success'));
    }
    setResetLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-primary-600 mb-8 text-center">
        {t('common.login')}
      </h1>
      <div className="bg-[#fff7f3] rounded-2xl shadow p-6 mb-8 text-center">
        <div className="text-2xl mb-2">👋✨</div>
        <div className="text-lg font-semibold text-primary-700 mb-1">{t('login.welcomeBack')}</div>
        <div className="text-gray-700 text-base">{t('login.welcomeDesc')}</div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {t('common.password')}
          </label>
          <input
            type="password"
            id="password"
            className="input-field mt-1"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
          <button
            type="button"
            className="text-primary-600 underline text-xs mt-2 ml-1 hover:text-primary-800"
            onClick={() => setShowReset(v => !v)}
          >
            Wachtwoord vergeten?
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
              {resetLoading ? t('common.loading') : t('login.forgotPassword')}
            </button>
            {resetMsg && <div className="text-xs mt-1 text-green-700">{resetMsg}</div>}
          </form>
        )}

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          className="btn-primary w-full flex items-center justify-center py-2 text-base rounded-xl font-medium"
          disabled={loading}
        >
          {loading ? (
            <LoadingIndicator size="sm" label={t('common.loading')} className="mr-2" />
          ) : null}
          {loading ? t('common.loading') : t('common.login')}
        </button>
      </form>

      <div className="text-center mt-6">
        <button
          className="text-primary-600 underline hover:text-primary-800 text-sm"
          onClick={() => navigate('/signup')}
        >
          {t('login.noAccountCta')}
        </button>
      </div>
    </div>
  );
};

export default Login; 