import React from 'react';
import { useTranslation } from 'react-i18next';

const CafeDetails: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <img src="https://source.unsplash.com/600x300/?coffee,rotterdam" alt={t('cafeDetails.title')} className="rounded-lg mb-6 h-56 object-cover w-full" />
        <h1 className="text-2xl font-bold text-primary-700 mb-2">{t('cafeDetails.title')}</h1>
        <p className="text-gray-600 mb-4">{t('cafeDetails.address')}</p>
        <p className="text-base text-gray-700 mb-4">{t('cafeDetails.description')}</p>
        <button className="btn-secondary">{t('cafeDetails.back')}</button>
      </div>
    </div>
  );
};

export default CafeDetails;
