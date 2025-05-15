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
  const [showSignup, setShowSignup] = useState(false);
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
  });
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Prefill email if saved
    const savedEmail = localStorage.getItem(UPDATES_EMAIL_KEY);
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setSignupData((prev) => ({ ...prev, email: savedEmail }));
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Account aangemaakt! Check je e-mail om te bevestigen.');
      setShowSignup(false);
      if (wantsUpdates) {
        localStorage.setItem(UPDATES_EMAIL_KEY, signupData.email);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-primary-600 mb-8 text-center">
        {t('common.login')}
      </h1>

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
          onClick={() => setShowSignup((v) => !v)}
        >
          Nog geen account? Maak hier je account
        </button>
      </div>

      {showSignup && (
        <form onSubmit={handleSignup} className="space-y-6 mt-8 bg-white/70 p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold text-primary-600 mb-2 text-center">Account aanmaken</h2>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
              {t('common.email')}
            </label>
            <input
              type="email"
              id="signup-email"
              className="input-field mt-1"
              value={signupData.email}
              onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700">
              {t('common.password')}
            </label>
            <input
              type="password"
              id="signup-password"
              className="input-field mt-1"
              value={signupData.password}
              onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="updates-checkbox"
              checked={wantsUpdates}
              onChange={() => setWantsUpdates((v) => !v)}
              className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 rounded"
            />
            <label htmlFor="updates-checkbox" className="text-sm text-gray-700 select-none">
              Houd mij op de hoogte van updates
            </label>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <button type="submit" className="btn-primary w-full">Account aanmaken</button>
        </form>
      )}
    </div>
  );
};

export default Login; 