import React, { useState, useEffect } from 'react';
import { OnboardingContext, useOnboarding } from './onboarding';

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if onboarding has been completed before
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete === 'true') {
      setIsOnboardingComplete(true);
    }
  }, []);

  const startOnboarding = () => {
    setShowOnboarding(true);
  };

  const completeOnboarding = () => {
    setIsOnboardingComplete(true);
    setShowOnboarding(false);
    localStorage.setItem('onboardingComplete', 'true');
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        showOnboarding,
        startOnboarding,
        completeOnboarding,
        skipOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export { useOnboarding };
