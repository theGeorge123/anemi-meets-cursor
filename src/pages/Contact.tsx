import { useTranslation } from 'react-i18next';
import PolicyContactForm from '../features/contact/components/PolicyContactForm';

const Contact = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-primary-600 sm:text-5xl">
          {t('common.contact')}
        </h1>
        <p className="mt-4 text-lg text-gray-500">{t('common.contactIntro')}</p>
      </div>
      <div className="mt-12">
        <PolicyContactForm />
      </div>
    </div>
  );
};

export default Contact;
