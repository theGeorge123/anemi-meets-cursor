import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t('onboarding.welcome.title'),
      description: t('onboarding.welcome.description'),
      image: '/images/onboarding/welcome.svg',
    },
    {
      title: t('onboarding.features.title'),
      description: t('onboarding.features.description'),
      image: '/images/onboarding/features.svg',
    },
    {
      title: t('onboarding.getting_started.title'),
      description: t('onboarding.getting_started.description'),
      image: '/images/onboarding/getting-started.svg',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t('common.close')}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="p-6">
            <div className="relative h-48 mb-6">
              <img
                src={steps[currentStep].image}
                alt={steps[currentStep].title}
                className="w-full h-full object-contain"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600 mb-6">
              {steps[currentStep].description}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-primary-600'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between gap-4">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('common.back')}
                </button>
              )}
              <button
                onClick={handleNext}
                className={`flex-1 px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors ${
                  currentStep === 0 ? 'w-full' : ''
                }`}
              >
                {currentStep === steps.length - 1
                  ? t('common.get_started')
                  : t('common.next')}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal; 