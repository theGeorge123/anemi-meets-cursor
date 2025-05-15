import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="w-full py-6 flex justify-center items-center gap-6 text-sm text-gray-500">
      <Link to="/privacy" className="hover:underline">{t('common.privacy')}</Link>
      <span>|</span>
      <Link to="/cookies" className="hover:underline">{t('common.cookies')}</Link>
      <span>|</span>
      <Link to="/terms" className="hover:underline">{t('common.terms')}</Link>
      <span>|</span>
      <Link to="/contact" className="hover:underline">{t('common.contact')}</Link>
    </footer>
  );
};

export default Footer; 