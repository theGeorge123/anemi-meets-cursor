import React, { useEffect } from 'react';

interface BadgeNotificationProps {
  badge: { emoji: string; label: string; description: string };
  onClose: () => void;
}

const BadgeNotification: React.FC<BadgeNotificationProps> = ({ badge, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-8 right-8 z-50 bg-white border-2 border-yellow-400 shadow-lg rounded-lg p-4 flex items-center gap-4 animate-bounce-in">
      <span className="text-4xl">{badge.emoji}</span>
      <div>
        <div className="font-bold text-lg">{badge.label}</div>
        <div className="text-sm text-gray-600">{badge.description}</div>
      </div>
      <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-700">×</button>
    </div>
  );
};

export default BadgeNotification; 