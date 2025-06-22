import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
// import { awardBadge } from '../services/badgeService';
import FormStatus from './FormStatus';

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
  const [loading, setLoading] = useState(false);

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
      // try {
      //   const hasBugHunterBadge = await hasBadge(user.id, 'bug-hunter');
      //   if (!hasBugHunterBadge) {
      //     await awardBadge(user.id, 'bug-hunter');
      //     console.info('Awarded bug hunter badge');
      //   }
      // } catch (badgeError) {
      //   console.error('Failed to award badge:', badgeError);
      // }

      // setStatus({ type: 'success', message: t('reportIssue.success') });
      // setTimeout(() => {
      //   setStatus(null);
      // }, 3000);

      setLoading(false);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Onbekende fout';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-issue-title"
      aria-describedby="report-issue-desc"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 relative animate-fade-in"
        tabIndex={0}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-primary-700 text-2xl"
          aria-label={t('common.cancel')}
        >
          ×
        </button>
        <h2 id="report-issue-title" className="text-xl font-bold mb-2">
          {t('reportIssue.title', 'Report a bug or idea')}
        </h2>
        <p id="report-issue-desc" className="text-gray-700 mb-4">
          {t(
            'reportIssue.intro',
            'Found a bug or have an idea to make Anemi Meets better? Let us know! We read every message ��💡',
          )}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="font-semibold">
              {t('reportIssue.descriptionLabel', 'Describe the bug or idea')}{' '}
              <span className="text-red-500">*</span>
            </span>
            <textarea
              required
              minLength={10}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field mt-1 min-h-[80px] text-base"
              placeholder={t(
                'reportIssue.descriptionPlaceholder',
                'What happened? Or what would you love to see?',
              )}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="font-semibold">
              {t('reportIssue.stepsLabel', 'Steps to reproduce (optional)')}
            </span>
            <textarea
              maxLength={1000}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              className="input-field mt-1 min-h-[60px] text-base"
              placeholder={t(
                'reportIssue.stepsPlaceholder',
                'How did you find this bug? Or how could we make it better?',
              )}
            />
          </label>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="font-semibold">
              {t('reportIssue.screenshotLabel', 'Screenshot (optional)')}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleScreenshotChange}
              className="input-field mt-1"
            />
          </label>
          <div className="flex gap-2 items-center mt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-6 py-2 rounded-2xl font-semibold disabled:opacity-60"
            >
              {t('reportIssue.submit', 'Report it! 🐞')}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 rounded-2xl">
              {t('cancel', 'Cancel')}
            </button>
          </div>
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {t('reportIssue.error', 'Oops! Something went wrong. Please try again.', { error })}
            </div>
          )}
          {success && (
            <div className="text-green-700 text-sm mt-2">
              {t('reportIssue.success', 'Thanks for your feedback! We appreciate it a latté ☕️')}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ReportIssueModal;
