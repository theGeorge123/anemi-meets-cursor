import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { Toast } from './ui/toast';
import { ToastTitle, ToastDescription } from './ui/toast';

const BetaSignup = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    if (!email || !email.includes('@')) {
      setToast({ message: t('betaSignup.invalidEmail'), type: 'error' });
      setLoading(false);
      return;
    }
    const { error } = await supabase.from('beta_signups').insert({ email });
    if (error) {
      if (error.code === '23505') {
        setToast({ message: t('betaSignup.alreadyOnList'), type: 'info' });
      } else {
        setToast({ message: t('betaSignup.error'), type: 'error' });
      }
    } else {
      setToast({ message: t('betaSignup.success'), type: 'success' });
      setEmail('');
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
      {toast && (
        <Toast>
          <ToastTitle>{toast.message}</ToastTitle>
          {toast.type && <ToastDescription>{toast.type}</ToastDescription>}
        </Toast>
      )}
    </section>
  );
};

export default BetaSignup;
