import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const Invite = () => {
  const { t } = useTranslation();
  const [inviteLink, setInviteLink] = useState('');
  const { token } = useParams();

  useEffect(() => {
    if (token) {
      setInviteLink(`${window.location.origin}/respond?token=${token}`);
    }
  }, [token]);

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-bold text-primary-600 mb-4">
        {t('invite.title')}
      </h1>
      
      <div className="card bg-primary-50 mb-8">
        <p className="text-gray-700 mb-4">
          {t('invite.message')}
        </p>
        
        <div className="bg-white p-4 rounded-lg border border-primary-200">
          <code className="text-primary-600 break-all">
            {inviteLink || '...'}
          </code>
        </div>
      </div>

      <button
        onClick={() => inviteLink && navigator.clipboard.writeText(inviteLink)}
        className="btn-secondary"
        disabled={!inviteLink}
      >
        Copy Link
      </button>
    </div>
  );
};

export default Invite; 