import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Validators } from '../../utils/validation';
import { MeetupFormData } from '../../types/meetups';

interface Props {
  formData: MeetupFormData;
  updateFormData: (patch: Partial<MeetupFormData>) => void;
  onNext: () => void;
}

export const ContactInfoStep = ({ formData, updateFormData, onNext }: Props) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const validate = () => {
    const errs: { name?: string; email?: string } = {};
    if (!Validators.required(formData.name)) errs.name = t('validation.required');
    if (!Validators.email(formData.email)) errs.email = t('validation.email');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-4">
      <div>
        <label>{t('meetup.name')}</label>
        <input
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          className="input"
        />
        {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
      </div>
      <div>
        <label>{t('meetup.email')}</label>
        <input
          value={formData.email}
          onChange={(e) => updateFormData({ email: e.target.value })}
          className="input"
        />
        {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
      </div>
      <button type="submit" className="btn-primary">
        {t('common.next')}
      </button>
    </form>
  );
};
