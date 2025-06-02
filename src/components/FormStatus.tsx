import React from 'react';
import { useTranslation } from 'react-i18next';

interface FormStatusProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

const FormStatus: React.FC<FormStatusProps> = ({ status, message }) => {
  const { t } = useTranslation();
  if (status === 'idle') return null;
  if (status === 'loading') {
    return <div className="flex items-center gap-2 text-primary-600 text-sm mt-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-t-2 border-primary-400 rounded-full"></span>{t('loading')}</div>;
  }
  if (status === 'success') {
    return <div className="text-green-600 text-sm mt-2">{message || t('success')}</div>;
  }
  if (status === 'error') {
    return <div className="text-red-500 text-sm mt-2">{message || t('error')}</div>;
  }
  return null;
};

export default FormStatus; 