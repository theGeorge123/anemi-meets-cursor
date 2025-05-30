import React, { createContext, useContext, useState, useEffect } from 'react';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  showOnboarding: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}; 