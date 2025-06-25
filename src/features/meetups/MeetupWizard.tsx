import { useState } from 'react';
import { WizardHeader } from './WizardHeader';
import { ContactInfoStep } from './ContactInfoStep';
import { CitySelectionStep } from './CitySelectionStep';
import { MeetupFormData, initialFormData } from '../../types/meetups';

export const MeetupWizard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<MeetupFormData>(initialFormData);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);
  const update = (patch: Partial<MeetupFormData>) => setFormData((prev) => ({ ...prev, ...patch }));

  return (
    <div className="meetup-wizard">
      <WizardHeader step={step} />
      {step === 1 && <ContactInfoStep formData={formData} updateFormData={update} onNext={next} />}
      {step === 2 && (
        <CitySelectionStep
          formData={formData}
          updateFormData={update}
          onNext={next}
          onBack={back}
        />
      )}
      {/* TODO step 3–5 */}
    </div>
  );
};
