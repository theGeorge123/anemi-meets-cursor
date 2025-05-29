import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import Confetti from 'react-confetti';

type InvitationWithCafe = {
  selected_date: string;
  selected_time: string;
  cafe_id?: string;
  cafe_name?: string;
  cafe_address?: string;
};

const Invite = () => {
  const { t } = useTranslation();
  const [inviteLink, setInviteLink] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { token } = useParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [invitation, setInvitation] = useState<InvitationWithCafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Check if Web Share API is available
    setCanShare(!!navigator.share);
  }, []);

  useEffect(() => {
    if (token) {
      setInviteLink(`${window.location.origin}/respond?token=${token}`);
      // Haal de uitnodiging op
      (async () => {
        setLoading(true);
        setError(null);
        const { data: inviteData, error: inviteError } = await supabase
          .from('invitations')
          .select('selected_date, selected_time, cafe_id')
          .eq('token', token)
          .single();
        if (inviteError || !inviteData) {
          setError(t('invite.errorNotFound'));
        } else {
          // If a cafe is linked, fetch its details for display
          if (inviteData.cafe_id) {
            const { data: cafeData, error: cafeError } = await supabase
              .from('cafes')
              .select('name, address')
              .eq('id', inviteData.cafe_id)
              .single();
            if (!cafeError && cafeData) {
              (inviteData as InvitationWithCafe).cafe_name = cafeData.name;
              (inviteData as InvitationWithCafe).cafe_address = cafeData.address;
            }
          }
          setInvitation(inviteData as InvitationWithCafe);
        }
        setLoading(false);
      })();
    }
  }, [token, t]);

  const handleCopy = async () => {
    if (!inviteLink) return;
    // Probeer Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(inviteLink);
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
        return;
      } catch (err) {
        // Fallback hieronder
      }
    }
    // Fallback: selecteer en kopieer via input
    if (inputRef.current) {
      inputRef.current.value = inviteLink;
      inputRef.current.style.display = 'block';
      inputRef.current.select();
      try {
        document.execCommand('copy');
        setCopyStatus('success');
      } catch (err) {
        setCopyStatus('error');
      }
      setTimeout(() => {
        setCopyStatus('idle');
        inputRef.current && (inputRef.current.style.display = 'none');
      }, 2000);
    } else {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleShare = async () => {
    if (!inviteLink || !canShare) return;

    const shareData = {
      title: t('invite.shareTitle'),
      text: invitation?.cafe_name 
        ? t('invite.shareTextWithCafe', { cafe: invitation.cafe_name })
        : t('invite.shareText'),
      url: inviteLink
    };

    try {
      await navigator.share(shareData);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setCopyStatus('error');
        setTimeout(() => setCopyStatus('idle'), 2000);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center px-2 sm:px-4 py-6">
      {inviteLink && <Confetti numberOfPieces={180} recycle={false} />}
      <h1 className="text-3xl sm:text-4xl font-bold text-primary-600 mb-4">
        {t('invite.titleStepCloser')} 🎉
      </h1>
      {/* <img src={happyGif} alt="Happy connect" className="mx-auto mb-6 w-40 sm:w-56 rounded-xl shadow-lg" style={{maxWidth:'100%'}} /> */}
      {loading && <div className="text-lg text-primary-700">{t('common.loading')}</div>}
      {error && <div className="text-red-600 font-semibold text-lg mb-4">{error}</div>}
      {invitation && (
        <div className="mb-6 bg-primary-50 rounded-xl p-4 shadow-md">
          <div className="font-semibold text-lg text-primary-700 mb-2">{t('invite.detailsHeading')}</div>
          {invitation.cafe_name ? (
            <>
              <div className="mb-1">{t('common.cafe')}: <span className="font-mono">{invitation.cafe_name}</span></div>
              <div className="mb-1">{t('common.address')}: <span className="font-mono">{invitation.cafe_address}</span></div>
            </>
          ) : invitation.cafe_id ? (
            <div className="mb-1">{t('common.cafe')}: <span className="font-mono">{invitation.cafe_id}</span></div>
          ) : (
            <div className="mb-1 text-gray-500">{t('invite.cafeInfoPending')}</div>
          )}
        </div>
      )}
      
      <div className="card bg-primary-50 mb-8 p-4 rounded-xl shadow-md">
        <p className="text-gray-700 mb-4 text-base sm:text-lg">
          {t('invite.shareInstructions')}
        </p>
        <div className="bg-white p-4 rounded-lg border border-primary-200 overflow-x-auto">
          <code className="text-primary-600 break-all text-sm sm:text-base">
            {inviteLink || '...'}
          </code>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {canShare ? (
          <button
            onClick={handleShare}
            className="btn-primary w-full sm:w-auto py-3 px-6 text-lg rounded-lg"
            disabled={!inviteLink}
          >
            {t('invite.share')}
          </button>
        ) : (
          <button
            onClick={handleCopy}
            className="btn-secondary w-full sm:w-auto py-3 px-6 text-lg rounded-lg"
            disabled={!inviteLink}
          >
            {t('invite.copyLink')}
          </button>
        )}
      </div>
      {/* Verborgen input voor fallback kopiëren */}
      <input
        ref={inputRef}
        type="text"
        style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, opacity: 0 }}
        readOnly
      />
      {copyStatus === 'success' && (
        <div className="text-green-600 mt-2">{t('invite.copySuccess')}</div>
      )}
      {copyStatus === 'error' && (
        <div className="text-red-600 mt-2">{t('invite.copyError')}</div>
      )}
    </div>
  );
};

export default Invite; 