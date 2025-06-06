import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ToastProps {
  message: string;
  icon?: React.ReactNode;
  duration?: number; // ms
  onClose?: () => void;
  type?: 'success' | 'error' | 'info';
}

const ICONS = {
  success: <span aria-hidden="true" className="text-green-600 text-2xl">✅</span>,
  error: <span aria-hidden="true" className="text-red-600 text-2xl">❌</span>,
  info: <span aria-hidden="true" className="text-blue-600 text-2xl">ℹ️</span>,
};

const Toast: React.FC<ToastProps> = ({ message, icon, duration = 5000, onClose, type = 'success' }) => {
  const { t } = useTranslation();
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (duration > 0) {
      timer.current = setTimeout(() => {
        onClose?.();
      }, duration);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [duration, onClose]);

  return (
    <div
      className={`fixed z-50 top-6 right-6 max-w-xs w-full shadow-lg rounded-lg flex items-start gap-3 p-4 border-2 bg-white
        ${type === 'success' ? 'border-green-400' : type === 'error' ? 'border-red-400' : 'border-blue-400'}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      tabIndex={0}
    >
      <div className="mt-1">{icon || ICONS[type]}</div>
      <div className="flex-1 text-sm text-gray-900" style={{ wordBreak: 'break-word' }}>{message}</div>
      <button
        onClick={onClose}
        aria-label={t('close')}
        className="ml-2 text-gray-500 hover:text-gray-900 focus:outline-none"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
};

export default Toast;
