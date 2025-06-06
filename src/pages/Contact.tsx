import { useTranslation } from 'react-i18next';
import PolicyContactForm from '../components/PolicyContactForm';

const Contact = () => {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold text-primary-600 mb-6">{t('contact')}</h1>
      <p className="mb-4">{t('contactIntro', "We love hearing from you! Got a question, idea, or just want to say hi? Drop us a message below ☕️✨")}</p>
      <PolicyContactForm />
    </div>
  );
};

export default Contact; 