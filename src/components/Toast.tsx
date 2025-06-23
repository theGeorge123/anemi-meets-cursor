import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ToastProps {
  title: string;
  description?: string;
  duration?: number; // ms
  onClose?: () => void;
  type?: 'success' | 'error' | 'info';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const ICONS = {
  success: (
    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  error: (
    <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  info: (
    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

const Toast: React.FC<ToastProps> = ({
  title,
  description,
  duration = 5000,
  onClose,
  type = 'success',
  position = 'top-right',
}) => {
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

  let positionClass = '';
  switch (position) {
    case 'top-left':
      positionClass = 'top-6 left-6 right-auto';
      break;
    case 'bottom-right':
      positionClass = 'bottom-6 right-6 top-auto';
      break;
    case 'bottom-left':
      positionClass = 'bottom-6 left-6 top-auto right-auto';
      break;
    default:
      positionClass = 'top-6 right-6';
  }

  return (
    <div
      className={`fixed z-50 max-w-sm w-full shadow-lg rounded-lg flex items-start gap-4 p-4 border bg-white ${positionClass}
        ${type === 'success' ? 'border-green-200' : type === 'error' ? 'border-red-200' : 'border-blue-200'}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex-shrink-0 mt-0.5">{ICONS[type]}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {description && <p className="mt-1 text-sm text-gray-700">{description}</p>}
      </div>
      <button
        onClick={onClose}
        aria-label={t('close')}
        className="ml-4 flex-shrink-0 rounded-md p-1 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
