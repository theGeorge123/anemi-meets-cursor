import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Respond = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    selectedTime: '',
  });

  // Dummy data - in a real app, this would come from the backend
  const availableTimes = [
    { id: 1, date: '2024-05-20', time: 'morning' },
    { id: 2, date: '2024-05-20', time: 'afternoon' },
    { id: 3, date: '2024-05-21', time: 'morning' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would send the response to the backend
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-primary-600 mb-2">
        {t('respond.title')}
      </h1>
      <p className="text-gray-600 mb-8">
        {t('respond.subtitle')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Available Times
          </label>
          <div className="space-y-3">
            {availableTimes.map((time) => (
              <label key={time.id} className="flex items-center">
                <input
                  type="radio"
                  name="selectedTime"
                  value={`${time.date}-${time.time}`}
                  checked={formData.selectedTime === `${time.date}-${time.time}`}
                  onChange={(e) => setFormData(prev => ({ ...prev, selectedTime: e.target.value }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-gray-700">
                  {new Date(time.date).toLocaleDateString()} - {t(`common.${time.time}`)}
                </span>
              </label>
            ))}
          </div>
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

        <button type="submit" className="btn-primary w-full">
          {t('common.submit')}
        </button>
      </form>
    </div>
  );
};

export default Respond; 