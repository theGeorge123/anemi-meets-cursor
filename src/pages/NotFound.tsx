import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation('common');
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <span className="text-6xl mb-4">😕</span>
      <h1 className="text-3xl font-bold text-primary-700 mb-2">{t('notFoundTitle', 'Page not found')}</h1>
      <p className="text-lg text-gray-600 mb-6">{t('notFoundDesc', 'Sorry, this page does not exist or has moved.')}</p>
      <Link to="/" className="btn-primary px-6 py-3 rounded-xl text-lg">{t('backToHome', 'Back to home')}</Link>
    </div>
  );
};

export default NotFound; 