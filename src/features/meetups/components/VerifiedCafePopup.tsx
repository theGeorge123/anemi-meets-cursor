import React from 'react';
import { useTranslation } from 'react-i18next';

export interface VerifiedCafePopupProps {
  cafe: {
    id?: string;
    name: string;
    story?: string | null;
    specialty?: string | null;
    mission?: string | null;
    image_url?: string | null;
  };
  open: boolean;
  onClose: () => void;
}

const VerifiedCafePopup: React.FC<VerifiedCafePopupProps> = ({ cafe, open, onClose }) => {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative" tabIndex={0}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-primary-700 text-2xl"
          aria-label={t('close') || 'Close'}
        >
          ×
        </button>
        {cafe.image_url && (
          <img
            src={cafe.image_url}
            alt={cafe.name}
            className="w-full h-40 object-cover rounded-lg mb-4"
          />
        )}
        <h2 className="text-xl font-bold text-primary-700 mb-2">{cafe.name}</h2>
        {cafe.story && <p className="text-gray-700 mb-4 whitespace-pre-line">{cafe.story}</p>}
        {cafe.specialty && (
          <p className="mb-2">
            <span className="font-semibold">{t('verifiedCafe.specialty')}:</span> {cafe.specialty}
          </p>
        )}
        {cafe.mission && (
          <p className="mb-4">
            <span className="font-semibold">{t('verifiedCafe.mission')}:</span> {cafe.mission}
          </p>
        )}
        <a href="/cafe-details" className="btn-secondary w-full text-center">
          {t('verifiedCafe.viewStory')}
        </a>
      </div>
    </div>
  );
};

export default VerifiedCafePopup;
