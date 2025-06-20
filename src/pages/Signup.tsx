import React, { useState } from 'react';
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

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('signup.emailPrompt')}</h2>
            <p className="text-gray-600 mb-6">Let's start with your email address.</p>
            <input
              type="email"
              id="signup-email"
              className={`w-full p-4 rounded-xl border-2 mb-4 text-lg ${
                errors.email ? 'border-red-500' : 'border-gray-200'
              }`}
              value={form.email}
              onChange={handleInputChange('email')}
              required
              placeholder={t('signup.emailPlaceholder')}
              autoComplete="email"
              disabled={!!inviteEmail}
            />
            {errors.email && <p className="text-red-600 mt-1">{errors.email}</p>}
          </>
        );
      case 2:
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('signup.namePrompt')}</h2>
            <p className="text-gray-600 mb-6">Your friends will see this name.</p>
            <input
              type="text"
              id="signup-name"
              className={`w-full p-4 rounded-xl border-2 mb-4 text-lg ${
                errors.fullName ? 'border-red-500' : 'border-gray-200'
              }`}
              value={form.fullName}
              onChange={handleInputChange('fullName')}
              required
              placeholder={t('signup.namePlaceholder')}
              autoComplete="name"
            />
            {errors.fullName && <p className="text-red-600 mt-1">{errors.fullName}</p>}
          </>
        );
      case 3:
        return (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('signup.passwordPrompt')}</h2>
            <p className="text-gray-600 mb-6">Make sure it's a strong one!</p>
            <input
              type="password"
              id="signup-password"
              className={`w-full p-4 rounded-xl border-2 mb-4 text-lg ${
                errors.password ? 'border-red-500' : 'border-gray-200'
              }`}
              value={form.password}
              onChange={handleInputChange('password')}
              required
              placeholder={t('signup.passwordPlaceholder')}
              autoComplete="new-password"
            />
            {errors.password && <p className="text-red-600 mt-1">{errors.password}</p>}
            <input
              type="password"
              id="signup-confirm-password"
              className={`w-full p-4 rounded-xl border-2 mt-4 text-lg ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
              }`}
              value={form.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              required
              placeholder={t('signup.confirmPasswordPlaceholder')}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="text-red-600 mt-1">{errors.confirmPassword}</p>
            )}
          </>
        );
      default:
        return null;
    }
  };

  const steps = [
    { number: 1, label: t('signup.step1') },
    { number: 2, label: t('signup.step2') },
    { number: 3, label: t('signup.step3') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-2 sm:px-0">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-800">{t('signup.title')}</h1>
          <p className="text-lg text-gray-500 mt-2">
            Just a few quick steps and you're ready to connect!
          </p>
        </header>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-12">
          {steps.map((item, index) => (
            <React.Fragment key={item.number}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                    step >= item.number
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  {item.number}
                </div>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    step >= item.number ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-auto border-t-2 mx-4 ${
                    step > item.number ? 'border-primary-600' : 'border-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <main>
          <form onSubmit={handleSubmit} className="bg-primary-50 p-4 sm:p-6 rounded-xl shadow-md">
            <div className="min-h-[220px]">{renderStepContent()}</div>

            <FormStatus
              status={loading ? 'loading' : error ? 'error' : 'idle'}
              message={error || ''}
            />

            <div className="mt-8 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="font-semibold text-gray-600 py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
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
          <div className="text-center mt-6">
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              {t('signup.alreadyHaveAccount')}
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
};

const SignupWithBoundary = () => (
  <ErrorBoundary>
    <Signup />
  </ErrorBoundary>
);

export default SignupWithBoundary;
