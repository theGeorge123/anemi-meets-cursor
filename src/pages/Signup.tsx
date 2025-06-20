import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SignupForm>({
    email: inviteEmail || '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const [errors, setErrors] = useState<SignupErrors>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateStep = () => {
    const newErrors: SignupErrors = {};
    if (step === 1) {
      if (!form.email) {
        newErrors.email = t('signup.errorEmailRequired');
      } else if (!/\S+@\S+\.\S+/.test(form.email)) {
        newErrors.email = t('signup.errorEmailInvalid');
      }
    } else if (step === 2) {
      if (!form.fullName) {
        newErrors.fullName = t('signup.errorNameRequired');
      }
    } else if (step === 3) {
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
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleInputChange =
    (field: keyof SignupForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

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
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: form.email,
          fullName: form.fullName,
        });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

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
    } catch (err) {
      console.error('Signup error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('signup.errorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <label htmlFor="signup-email" className="block text-lg font-medium text-gray-700 mb-2">
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
        );
      case 2:
        return (
          <div>
            <label htmlFor="signup-name" className="block text-lg font-medium text-gray-700 mb-2">
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
        );
      case 3:
        return (
          <>
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
                <span className="text-2xl">🔒</span> {t('signup.confirmPasswordPrompt')}
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
          </>
        );
      default:
        return null;
    }
  };

  const steps = [t('signup.step1'), t('signup.step2'), t('signup.step3')];

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-4">{t('signup.title')}</h1>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-1">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={`text-sm font-semibold ${
                    step > i ? 'text-primary-600' : 'text-gray-400'
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
            <div className="relative w-full h-2 bg-gray-200 rounded-full">
              <div
                className="absolute top-0 left-0 h-2 bg-primary-600 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="min-h-[140px]">{renderStep()}</div>

            <FormStatus
              status={loading ? 'loading' : error ? 'error' : 'idle'}
              message={error || ''}
            />
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-gray-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100"
                  >
                    {t('common.back')}
                  </button>
                ) : (
                  <div />
                )}
                {step < 3 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-primary-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-primary-700 shadow-md transform hover:scale-105 transition-transform duration-200"
                  >
                    {t('common.next')}
                  </button>
                )}
              </div>
              {step === 3 && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 shadow-lg transform hover:scale-105 transition-transform duration-200"
                >
                  {loading ? t('common.loading') : t('signup.submit')}
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="text-center mt-6">
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            {t('signup.alreadyHaveAccount')}
          </Link>
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
