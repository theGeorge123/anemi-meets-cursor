import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FormStatus from './FormStatus';

const PolicyContactForm = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/contact', {
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
    <div className="mt-10">
      <h2 className="text-xl font-semibold text-primary-600 mb-4">{t('common.contact')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">{t('common.contactName')}</label>
          <input
            id="contact-name"
            type="text"
            className="input-field mt-1 min-h-[48px] text-base"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            autoFocus
            placeholder={t('common.namePlaceholder')}
            inputMode="text"
            autoComplete="given-name"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">{t('common.contactEmail')}</label>
          <input
            id="contact-email"
            type="email"
            className="input-field mt-1 min-h-[48px] text-base"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            placeholder={t('common.emailPlaceholder')}
            inputMode="email"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700">{t('common.contactMessage')}</label>
          <textarea
            id="contact-message"
            className="input-field mt-1 min-h-[48px] text-base"
            rows={4}
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            required
            placeholder={t('common.messagePlaceholder')}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? t('common.loading') : t('common.contactSend')}</button>
        <FormStatus status={loading ? 'loading' : status} message={status === 'success' ? t('common.contactSuccess') : status === 'error' ? t('common.contactError') : undefined} />
      </form>
    </div>
  );
};

export default PolicyContactForm; 