// import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import ReportIssueModal from './ReportIssueModal';

const Footer = () => {
  // const { t } = useTranslation();
  const [showReportModal, setShowReportModal] = useState(false);
  return (
    <footer aria-label="Site footer" className="w-full border-t border-primary-100 py-8 px-4 flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-gray-600 font-medium bg-white/90 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-y-3 gap-x-6 w-full sm:w-auto">
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
          <Link to="/contact" className="footer-link">Contact</Link>
        </div>
      </div>
      <button onClick={() => setShowReportModal(true)} className="btn-secondary px-4 py-2 rounded-2xl w-full sm:w-auto text-center mt-2 sm:mt-0">Report a bug or idea</button>
      <ReportIssueModal open={showReportModal} onClose={() => setShowReportModal(false)} />
    </footer>
  );
};

export default Footer;
