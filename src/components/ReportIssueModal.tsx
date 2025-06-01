import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ReportIssueModal: React.FC<Props> = ({ open, onClose }) => {
  const location = useLocation();
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    let screenshotBase64 = null;
    if (screenshot) {
      const reader = new FileReader();
      screenshotBase64 = await new Promise<string | null>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(screenshot);
      });
    }
    const context = {
      route: location.pathname,
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      },
      timestamp: new Date().toISOString(),
    };
    try {
      const res = await fetch('/functions/v1/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          steps,
          screenshot: screenshotBase64,
          context,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      setSuccess(true);
      setDescription('');
      setSteps('');
      setScreenshot(null);
    } catch (err: any) {
      setError(err.message || 'Onbekende fout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-primary-700 text-2xl" aria-label={t('common.cancel')}>×</button>
        <h2 className="text-xl font-bold mb-2">{t('reportIssue.title')}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-semibold">{t('reportIssue.descriptionLabel')} <span className="text-red-500">*</span></span>
            <textarea required minLength={10} maxLength={1000} value={description} onChange={e => setDescription(e.target.value)} className="border rounded p-2 min-h-[80px]" placeholder={t('reportIssue.descriptionPlaceholder')} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">{t('reportIssue.stepsLabel')}</span>
            <textarea maxLength={1000} value={steps} onChange={e => setSteps(e.target.value)} className="border rounded p-2 min-h-[60px]" placeholder={t('reportIssue.stepsPlaceholder')} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">{t('reportIssue.screenshotLabel')}</span>
            <input type="file" accept="image/*" onChange={handleScreenshotChange} />
          </label>
          <div className="flex gap-2 items-center mt-2">
            <button type="submit" disabled={submitting} className="btn-primary px-6 py-2 rounded font-semibold disabled:opacity-60">{t('reportIssue.submit')}</button>
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 rounded">{t('common.cancel')}</button>
          </div>
          {error && <div className="text-red-600 text-sm mt-2">{t('reportIssue.error', { error })}</div>}
          {success && <div className="text-green-700 text-sm mt-2">{t('reportIssue.success')}</div>}
        </form>
      </div>
    </div>
  );
};

export default ReportIssueModal; 