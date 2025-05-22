import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const UPDATES_EMAIL_KEY = 'anemi-updates-email';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

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
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    if (error) {
      setError(error.message);
    } else {
      navigate('/create-meetup');
    }
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
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button type="submit" className="btn-primary w-full">
          {t('common.login')}
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