import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorService } from '../services/error/ErrorService';

const BetaSignup = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!email || !email.includes('@')) {
      ErrorService.toast(t('betaSignup.invalidEmail'), 'error');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        'https://bijyercgpgaheeoeumtv.functions.supabase.co/beta-accept-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ record: { email, status: 'pending' } }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data && data.error && data.error.code === '23505') {
          ErrorService.toast(t('betaSignup.alreadyOnList'), 'info');
        } else {
          ErrorService.toast(t('betaSignup.error'), 'error');
        }
      } else {
        ErrorService.toast(t('betaSignup.success'), 'success');
        setEmail('');
      }
    } catch (err) {
      ErrorService.toast(t('betaSignup.error'), 'error');
    }
    setLoading(false);
  };

  return (
    <section className="relative w-full bg-gradient-to-br from-blue-50 via-green-50 to-white py-12 px-4 flex flex-col items-center justify-center text-center mb-8 overflow-hidden">
      {/* Fun floating shapes */}
      <span className="absolute left-10 top-8 animate-float-slow text-4xl opacity-20 select-none pointer-events-none">
        ☕️
      </span>
      <span className="absolute right-16 top-20 animate-float-slower text-3xl opacity-10 select-none pointer-events-none">
        🟠
      </span>
      <span className="absolute left-1/2 bottom-10 animate-float-slow text-5xl opacity-10 select-none pointer-events-none">
        🟢
      </span>
      <span className="absolute right-1/4 bottom-24 animate-float-slower text-4xl opacity-10 select-none pointer-events-none">
        🌈
      </span>

      <h2
        className="relative z-10 text-5xl sm:text-6xl font-extrabold text-primary-700 mb-4 drop-shadow-lg font-fun animate-bounce"
        style={{ letterSpacing: '0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
      >
        {t('betaSignup.title')}{' '}
        <span role="img" aria-label="party">
          🎉
        </span>
      </h2>
      <p className="relative z-10 text-lg sm:text-xl text-primary-700 mb-4 max-w-2xl mx-auto font-lato">
        {t('betaSignup.description')}
        <br />
        <span className="italic text-accent-500">{t('betaSignup.tagline')}</span>
      </p>
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex flex-col sm:flex-row gap-2 items-center justify-center w-full max-w-md mx-auto"
      >
        <input
          type="email"
          className="input-field flex-1 text-lg rounded-full shadow-lg"
          placeholder={t('betaSignup.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-primary px-8 py-3 text-lg font-bold rounded-full shadow-lg flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            t('betaSignup.sending')
          ) : (
            <>
              {t('betaSignup.cta')} <span>☕️</span>
            </>
          )}
        </button>
      </form>
      {/* Animated illustration (if you have one) */}
      <div className="relative z-10 mt-12 animate-float-slow">
        {/* Place your SVG or illustration here if desired */}
      </div>
    </section>
  );
};

export default BetaSignup;
