import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import FormStatus from '../components/FormStatus';
import ErrorBoundary from '../components/ErrorBoundary';

interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}

interface SignupErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
}

const Signup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite_token');
  const inviteEmail = searchParams.get('email');

  const [form, setForm] = useState<SignupForm>({
    email: inviteEmail || '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const [errors, setErrors] = useState<SignupErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: SignupErrors = {};
    if (!form.email) {
      newErrors.email = t('signup.errorEmailRequired');
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = t('signup.errorEmailInvalid');
    }
    if (!form.password) {
      newErrors.password = t('signup.errorPasswordRequired');
    } else if (form.password.length < 8) {
      newErrors.password = t('signup.errorPasswordLength');
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = t('signup.errorConfirmRequired');
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('signup.errorPasswordMatch');
    }
    if (!form.fullName) {
      newErrors.fullName = t('signup.errorNameRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof SignupForm) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data?.user) {
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: form.email,
          fullName: form.fullName,
        });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        // If there's an invite token, handle it
        if (inviteToken) {
          try {
            await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-friend-invite`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${data.session?.access_token}`,
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              },
              body: JSON.stringify({ token: inviteToken, email: form.email }),
            });
          } catch (err) {
            console.error('Error accepting friend invite:', err);
          }
        }

        navigate('/check-email');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || t('signup.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          {t('signup.title')}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="signup-email"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              <span className="text-2xl">📧</span> {t('signup.emailPrompt')}
            </label>
            <input
              type="email"
              id="signup-email"
              className={`w-full p-3 rounded-xl border-2 border-gray-200 mb-4 text-base${
                errors.email ? ' border-red-500' : ''
              }`}
              value={form.email}
              onChange={handleInputChange('email')}
              required
              placeholder={t('signup.emailPlaceholder')}
              inputMode="email"
              autoComplete="email"
              disabled={!!inviteEmail}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1" aria-live="assertive">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-name"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              <span className="text-2xl">👋</span> {t('signup.namePrompt')}
            </label>
            <input
              type="text"
              id="signup-name"
              className={`w-full p-3 rounded-xl border-2 border-gray-200 mb-4 text-base${
                errors.fullName ? ' border-red-500' : ''
              }`}
              value={form.fullName}
              onChange={handleInputChange('fullName')}
              required
              placeholder={t('signup.namePlaceholder')}
              inputMode="text"
              autoComplete="name"
            />
            {errors.fullName && (
              <p className="text-red-600 text-sm mt-1" aria-live="assertive">
                {errors.fullName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              <span className="text-2xl">🔒</span> {t('signup.passwordPrompt')}
            </label>
            <input
              type="password"
              id="signup-password"
              className={`w-full p-3 rounded-xl border-2 border-gray-200 mb-4 text-base${
                errors.password ? ' border-red-500' : ''
              }`}
              value={form.password}
              onChange={handleInputChange('password')}
              required
              placeholder={t('signup.passwordPlaceholder')}
              inputMode="text"
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1" aria-live="assertive">
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-confirm-password"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              <span className="text-2xl">🔒</span>{' '}
              {t('signup.confirmPasswordPrompt')}
            </label>
            <input
              type="password"
              id="signup-confirm-password"
              className={`w-full p-3 rounded-xl border-2 border-gray-200 mb-4 text-base${
                errors.confirmPassword ? ' border-red-500' : ''
              }`}
              value={form.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              required
              placeholder={t('signup.confirmPasswordPlaceholder')}
              inputMode="text"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1" aria-live="assertive">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <FormStatus
            status={loading ? 'loading' : error ? 'error' : 'idle'}
            message={error || ''}
          />

          <button
            type="submit"
            className="btn-primary w-full py-3 px-6 text-lg rounded-lg"
            disabled={loading}
          >
            {t('signup.submitButton')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-primary-600 underline hover:text-primary-800 text-sm"
          >
            {t('signup.alreadyHaveAccount')}
          </a>
        </div>
      </div>
    </main>
  );
};

const SignupWithBoundary = () => (
  <ErrorBoundary>
    <Signup />
  </ErrorBoundary>
);

export default SignupWithBoundary;
