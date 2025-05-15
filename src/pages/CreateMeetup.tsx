import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { cities, cafes } from '../data/mockData';
import "react-datepicker/dist/react-datepicker.css";

const CreateMeetup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dates: [] as Date[],
    timePreference: '',
    city: '',
  });
  const [selectedCafe, setSelectedCafe] = useState<typeof cafes[keyof typeof cafes][0] | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would save the data here
    navigate('/invite');
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
    if (city && cafes[city as keyof typeof cafes]) {
      const cityCafes = cafes[city as keyof typeof cafes];
      const randomCafe = cityCafes[Math.floor(Math.random() * cityCafes.length)];
      setSelectedCafe(randomCafe);
    } else {
      setSelectedCafe(null);
    }
  };

  const shuffleCafe = () => {
    if (formData.city && cafes[formData.city as keyof typeof cafes]) {
      const cityCafes = cafes[formData.city as keyof typeof cafes];
      if (cityCafes.length <= 1) return;
      let newCafe = selectedCafe;
      while (newCafe === selectedCafe) {
        newCafe = cityCafes[Math.floor(Math.random() * cityCafes.length)];
      }
      setSelectedCafe(newCafe);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-primary-600 mb-2">
        {t('createMeetup.title')}
      </h1>
      <p className="text-gray-600 mb-8">
        {t('createMeetup.subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {t('common.name')}
          </label>
          <input
            type="text"
            id="name"
            className="input-field mt-1"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('common.email')}
          </label>
          <input
            type="email"
            id="email"
            className="input-field mt-1"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('common.date')}
          </label>
          <DatePicker
            selected={formData.dates[0]}
            onChange={(dates: Date[]) => setFormData(prev => ({ ...prev, dates }))}
            selectsMultiple
            inline
            minDate={new Date()}
            maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
            className="mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('common.time')}
          </label>
          <div className="mt-2 space-y-2">
            {['morning', 'afternoon', 'evening'].map((time) => (
              <label key={time} className="flex items-center">
                <input
                  type="radio"
                  name="timePreference"
                  value={time}
                  checked={formData.timePreference === time}
                  onChange={(e) => setFormData(prev => ({ ...prev, timePreference: e.target.value }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-gray-700">{t(`common.${time}`)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            {t('common.city')}
          </label>
          <select
            id="city"
            className="input-field mt-1"
            value={formData.city}
            onChange={(e) => handleCityChange(e.target.value)}
            required
          >
            <option value="">Select a city</option>
            {cities.map((city) => (
              <option key={city.id} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCafe && (
          <div className="card bg-primary-50">
            <h3 className="text-lg font-medium text-primary-600">
              Suggested Cafe
            </h3>
            <p className="text-gray-700">{selectedCafe.name}</p>
            <p className="text-gray-500">{selectedCafe.address}</p>
            {formData.city && cafes[formData.city as keyof typeof cafes] && cafes[formData.city as keyof typeof cafes].length > 1 && (
              <button
                type="button"
                className="btn-secondary mt-2"
                onClick={shuffleCafe}
              >
                Shuffle Cafe
              </button>
            )}
          </div>
        )}

        <button type="submit" className="btn-primary w-full">
          {t('common.continue')}
        </button>
      </form>
    </div>
  );
};

export default CreateMeetup; 