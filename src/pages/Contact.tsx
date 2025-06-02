import { useTranslation } from 'react-i18next';
import PolicyContactForm from '../components/PolicyContactForm';

const Contact = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold text-primary-600 mb-6">{t('contact')}</h1>
      <p className="mb-4">{t('contactMessage')}</p>
      <PolicyContactForm />
    </div>
  );
};

export default Contact; 