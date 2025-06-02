import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function OnboardingModal({ onFinish }: { onFinish: () => void }) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t('onboarding.welcome.title'),
      description: t('onboarding.welcome.description'),
      emoji: '👋',
    },
    {
      title: t('onboarding.features.title'),
      description: t('onboarding.features.description'),
      emoji: '📅',
    },
    {
      title: t('onboarding.getting_started.title'),
      description: t('onboarding.getting_started.description'),
      emoji: '☕️',
    },
  ];

  const handleSkip = () => {
    localStorage.setItem('anemi-onboarded', '1');
    onFinish();
  };
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('anemi-onboarded', '1');
      onFinish();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      aria-describedby="onboarding-modal-desc"
      tabIndex={-1}
      onKeyDown={e => { if (e.key === 'Escape') handleSkip(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-8 w-full max-w-xs sm:max-w-md relative animate-fade-in flex flex-col items-center" tabIndex={0}>
        {/* Skip knop */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-primary-600 text-lg font-bold"
          onClick={handleSkip}
          aria-label={t('skip')}
        >
          ×
        </button>
        {/* Stap illustratie/icon */}
        <div className="flex flex-col items-center mb-6 w-full">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-primary-100 shadow-sm text-5xl sm:text-6xl">
            {steps[currentStep].emoji}
          </div>
          <h2 id="onboarding-modal-title" className="text-xl font-bold text-primary-700 mb-2 text-center break-words">{steps[currentStep].title}</h2>
          <p id="onboarding-modal-desc" className="text-gray-700 text-center mb-2 text-base break-words">{steps[currentStep].description}</p>
        </div>
        {/* Navigatie */}
        <div className="flex flex-col gap-3 w-full mt-2">
          <button
            onClick={handleSkip}
            className="btn-secondary w-full"
          >
            {t('skip')}
          </button>
          <button
            onClick={handleNext}
            className="btn-primary w-full"
          >
            {currentStep === steps.length - 1
              ? t('get_started')
              : t('next')}
          </button>
        </div>
        {/* Stappen indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full ${i === currentStep ? 'bg-primary-600' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 