import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCities } from '../../services/meetups';
import { MeetupFormData } from '../../types/meetups';

interface Props {
  formData: MeetupFormData;
  updateFormData: (patch: Partial<MeetupFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface City {
  id: string;
  name: string;
}

export const CitySelectionStep = ({ formData, updateFormData, onNext, onBack }: Props) => {
  const { t } = useTranslation();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCities().then((res) => {
      if (res.error) setError(t('common.errorLoadingCities'));
      else setCities(res.data || []);
      setLoading(false);
    });
  }, [t]);

  const valid = !!formData.city;

  return (
    <div className="space-y-4">
      <label>{t('meetup.city')}</label>
      {loading ? (
        <div>{t('common.loading')}</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <select
          value={formData.city}
          onChange={(e) => updateFormData({ city: e.target.value })}
          className="input"
        >
          <option value="">{t('common.select')}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2 mt-4">
        <button onClick={onBack} className="btn-secondary">
          {t('common.back')}
        </button>
        <button onClick={onNext} className="btn-primary" disabled={!valid}>
          {t('common.next')}
        </button>
      </div>
    </div>
  );
};
