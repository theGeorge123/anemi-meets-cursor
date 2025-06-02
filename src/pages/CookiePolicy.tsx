import { useTranslation } from 'react-i18next';

const CookiePolicy = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold text-primary-600 mb-6">{t('cookies')}</h1>
      <p className="mb-4 whitespace-pre-line">{t('cookiesFull')}</p>
      <p className="text-gray-500">{t('lastUpdate')} {new Date().toLocaleDateString()}</p>
    </div>
  );
};

export default CookiePolicy; 