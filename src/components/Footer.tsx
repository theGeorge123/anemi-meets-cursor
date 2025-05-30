import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="w-full py-6 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 text-sm text-gray-500">
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2">
        <Link to="/cookies" className="hover:underline">{t('common.cookies')}</Link>
        <span className="hidden sm:inline">|</span>
        <Link to="/privacy" className="hover:underline">{t('common.privacy')}</Link>
      </div>
      <span className="hidden sm:inline">|</span>
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2">
        <Link to="/terms" className="hover:underline">{t('common.terms')}</Link>
        <span className="hidden sm:inline">|</span>
        <Link to="/contact" className="hover:underline">{t('common.contact')}</Link>
      </div>
    </footer>
  );
};

export default Footer; 