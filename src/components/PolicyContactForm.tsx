import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold text-primary-600 mb-4">{t('common.contact')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">{t('common.contactName')}</label>
          <input
            id="contact-name"
            type="text"
            className="input-field mt-1"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">{t('common.contactEmail')}</label>
          <input
            id="contact-email"
            type="email"
            className="input-field mt-1"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700">{t('common.contactMessage')}</label>
          <textarea
            id="contact-message"
            className="input-field mt-1"
            rows={4}
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? t('common.loading') : t('common.contactSend')}</button>
        {status === 'success' && <div className="text-green-600 text-sm mt-2">{t('common.contactSuccess')}</div>}
        {status === 'error' && <div className="text-red-500 text-sm mt-2">{t('common.contactError')}</div>}
      </form>
    </div>
  );
};

export default PolicyContactForm; 