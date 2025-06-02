import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import ReportIssueModal from './ReportIssueModal';

const Footer = () => {
  const { t } = useTranslation();
  const [showReportModal, setShowReportModal] = useState(false);
  return (
    <footer className="w-full border-t border-[#b2dfdb]/40 py-8 px-4 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 text-sm text-gray-600 font-medium bg-white/90 mt-auto">
      <div className="flex flex-col sm:flex-row items-center gap-y-2 gap-x-4 sm:gap-6 w-full sm:w-auto">
        <Link to="/cookies" className="hover:text-primary-700 underline transition-colors block sm:inline-block min-h-[44px] min-w-[44px] px-2 py-2 sm:px-0 sm:py-0 text-center">{t('cookies')}</Link>
        <span className="hidden sm:inline">|</span>
        <Link to="/privacy" className="hover:text-primary-700 underline transition-colors block sm:inline-block min-h-[44px] min-w-[44px] px-2 py-2 sm:px-0 sm:py-0 text-center">{t('privacy')}</Link>
        <span className="hidden sm:inline">|</span>
        <Link to="/terms" className="hover:text-primary-700 underline transition-colors block sm:inline-block min-h-[44px] min-w-[44px] px-2 py-2 sm:px-0 sm:py-0 text-center">{t('terms')}</Link>
        <span className="hidden sm:inline">|</span>
        <Link to="/contact" className="hover:text-primary-700 underline transition-colors block sm:inline-block min-h-[44px] min-w-[44px] px-2 py-2 sm:px-0 sm:py-0 text-center">{t('contact')}</Link>
      </div>
      <button onClick={() => setShowReportModal(true)} className="btn-secondary px-4 py-2 rounded-2xl ml-0 sm:ml-6 mt-2 sm:mt-0 min-h-[44px] min-w-[44px]">{t('reportIssue.title')}</button>
      <ReportIssueModal open={showReportModal} onClose={() => setShowReportModal(false)} />
    </footer>
  );
};

export default Footer; 