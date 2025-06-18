import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import Toast from './Toast';

const BetaSignup = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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
    <section className="w-full bg-accent-50 border-b-2 border-accent-200 py-8 px-4 flex flex-col items-center justify-center text-center mb-8">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-700 mb-2">{t('betaSignup.title')}</h2>
      <p className="text-lg text-primary-600 mb-4 max-w-xl mx-auto">
        {t('betaSignup.description')}<br/>
        <span className="text-accent-500">{t('betaSignup.tagline')}</span>
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 items-center justify-center w-full max-w-md mx-auto">
        <input
          type="email"
          className="input-field flex-1 text-lg"
          placeholder={t('betaSignup.emailPlaceholder')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <button
          type="submit"
          className="btn-primary px-6 py-3 text-lg font-bold"
          disabled={loading}
        >
          {loading ? t('betaSignup.sending') : t('betaSignup.cta')}
        </button>
      </form>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          position="bottom-right"
        />
      )}
    </section>
  );
};

export default BetaSignup; 