import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const steps = [
  {
    icon: '🤝',
    titleKey: 'onboarding.step1Title',
    descKey: 'onboarding.step1Desc',
  },
  {
    icon: '📅',
    titleKey: 'onboarding.step2Title',
    descKey: 'onboarding.step2Desc',
  },
  {
    icon: '☕️',
    titleKey: 'onboarding.step3Title',
    descKey: 'onboarding.step3Desc',
  },
];

export default function OnboardingModal({ onFinish }: { onFinish: () => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const handleSkip = () => {
    localStorage.setItem('anemi-onboarded', '1');
    onFinish();
  };
  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('anemi-onboarded', '1');
      onFinish();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
        {/* Skip knop */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-primary-600 text-lg font-bold"
          onClick={handleSkip}
          aria-label={t('onboarding.skip')}
        >
          ×
        </button>
        {/* Stap illustratie/icon */}
        <div className="flex flex-col items-center mb-6">
          <span className="text-6xl mb-2">{steps[step].icon}</span>
          <h2 className="text-xl font-bold text-primary-700 mb-2">{t(steps[step].titleKey)}</h2>
          <p className="text-gray-700 text-center mb-2">{t(steps[step].descKey)}</p>
        </div>
        {/* Navigatie */}
        <div className="flex flex-col gap-4 mt-6">
          <button
            className="btn-primary w-full active:scale-95 active:bg-[#b2dfdb]"
            onClick={handleNext}
          >
            {step < steps.length - 1 ? t('onboarding.next') : t('onboarding.finishCta')}
          </button>
          <button
            className="btn-secondary w-full text-sm text-gray-500 hover:text-primary-700 active:scale-95"
            onClick={handleSkip}
          >
            {t('onboarding.skip')}
          </button>
        </div>
        {/* Stappen indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`w-3 h-3 rounded-full ${i === step ? 'bg-primary-600' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 