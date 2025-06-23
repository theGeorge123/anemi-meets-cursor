import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FormStatus from '../../../components/FormStatus';

type StatusType = 'success' | 'error' | 'loading' | 'idle';

const PolicyContactForm = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<StatusType>('idle');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    try {
      const res = await fetch('/functions/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      const content = viewport.getAttribute('content');
      if (content && !content.includes('maximum-scale')) {
        viewport.setAttribute('content', content + ', maximum-scale=1.0');
      }
    }
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-lg p-8">
      <h2 className="text-2xl font-bold text-center text-primary-600 mb-6">
        {t('common.contact')}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">
            {t('common.contactName')}
          </label>
          <input
            id="contact-name"
            type="text"
            className="input-field mt-1 min-h-[48px] text-base"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            autoFocus
            placeholder={t('common.namePlaceholder')}
            inputMode="text"
            autoComplete="given-name"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">
            {t('common.contactEmail')}
          </label>
          <input
            id="contact-email"
            type="email"
            className="input-field mt-1 min-h-[48px] text-base"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            placeholder={t('common.emailPlaceholder')}
            inputMode="email"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700">
            {t('common.contactMessage')}
          </label>
          <textarea
            id="contact-message"
            className="input-field mt-1 min-h-[48px] text-base"
            rows={4}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            required
            placeholder={t('common.messagePlaceholder')}
          />
        </div>
        <div className="text-center">
          <button type="submit" className="btn-primary w-full md:w-auto" disabled={loading}>
            {loading ? t('common.loading') : t('common.contactSend')}
          </button>
        </div>
        <div className="h-5">
          {status !== 'idle' && (
            <FormStatus
              type={status === 'loading' ? 'info' : (status as 'success' | 'error' | 'info')}
              msg={
                status === 'success'
                  ? (t('common.contactSuccess') ?? '')
                  : status === 'error'
                    ? (t('common.contactError') ?? '')
                    : status === 'loading'
                      ? t('common.loading')
                      : ''
              }
            />
          )}
        </div>
      </form>
    </div>
  );
};

export default PolicyContactForm;
