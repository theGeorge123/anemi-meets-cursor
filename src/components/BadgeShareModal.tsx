import React from 'react';

interface BadgeShareModalProps {
  badge: { emoji: string; label: string; description: string };
  onClose: () => void;
}

const BadgeShareModal: React.FC<BadgeShareModalProps> = ({ badge, onClose }) => {
  const shareText = `I just earned the \"${badge.label}\" badge on Anemi Meets! ${badge.emoji}`;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Badge Earned: ${badge.label}`,
        text: shareText,
        url: window.location.href
      });
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center">
        <div className="text-5xl mb-2">{badge.emoji}</div>
        <div className="font-bold text-lg mb-1">{badge.label}</div>
        <div className="text-sm text-gray-600 mb-4">{badge.description}</div>
        <button onClick={handleShare} className="btn-primary mb-2">Share Achievement</button>
        <button onClick={onClose} className="btn-secondary">Close</button>
      </div>
    </div>
  );
};

export default BadgeShareModal; 