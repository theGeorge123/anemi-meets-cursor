import React from 'react';
import { useTranslation } from 'react-i18next';

// Mock data for cafes
const cafes = [
  {
    id: '1',
    nameKey: 'explore.cafe1.name',
    addressKey: 'explore.cafe1.address',
    descriptionKey: 'explore.cafe1.description',
    image_url: 'https://source.unsplash.com/400x200/?coffee,rotterdam',
  },
  {
    id: '2',
    nameKey: 'explore.cafe2.name',
    addressKey: 'explore.cafe2.address',
    descriptionKey: 'explore.cafe2.description',
    image_url: 'https://source.unsplash.com/400x200/?espresso,bar',
  },
  {
    id: '3',
    nameKey: 'explore.cafe3.name',
    addressKey: 'explore.cafe3.address',
    descriptionKey: 'explore.cafe3.description',
    image_url: 'https://source.unsplash.com/400x200/?latte,cafe',
  },
];

const Explore: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary-700 mb-8 text-center">{t('explore.title')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {cafes.map(cafe => (
          <div key={cafe.id} className="bg-white rounded-xl shadow-md p-4 flex flex-col">
            <img src={cafe.image_url} alt={t(cafe.nameKey)} className="rounded-lg mb-4 h-40 object-cover" />
            <h2 className="text-lg font-semibold text-primary-700 mb-1">{t(cafe.nameKey)}</h2>
            <p className="text-gray-600 mb-2">{t(cafe.addressKey)}</p>
            <p className="text-base text-gray-700 mb-4 line-clamp-2">{t(cafe.descriptionKey)}</p>
            <button className="btn-primary mt-auto">{t('explore.viewDetails')}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explore;
