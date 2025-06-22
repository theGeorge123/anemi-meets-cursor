import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';

type InvitationWithCafe = {
  selected_date: string;
  selected_time: string;
  cafe_id?: string;
  cafe_name?: string;
  cafe_address?: string;
  date_time_options?: { date: string; times: string[] }[];
};

const Invite = () => {
  const { t } = useTranslation();
  const [inviteLink, setInviteLink] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { token } = useParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [invitation, setInvitation] = useState<InvitationWithCafe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    // Check if Web Share API is available
    setCanShare(!!navigator.share);
  }, []);

  useEffect(() => {
    if (token) {
      setInviteLink(`${window.location.origin}/respond/${token}`);
      // Show cached data instantly if available
      const cached = localStorage.getItem(`friend_invite_${token}`);
      if (cached) {
        try {
          setInvitation(JSON.parse(cached));
        } catch (err) {
          // ignore
        }
      }
      (async () => {
        setDetailsLoading(true);
        setError(null);
        try {
          const { data: inviteData, error: inviteError } = await supabase
            .from('invitations')
            .select('selected_date, selected_time, cafe_id, date_time_options')
            .eq('token', token)
            .maybeSingle();
          if (inviteError) {
            setError(t('invite.errorNotFound', 'This invitation link is invalid or expired.'));
          } else if (!inviteData) {
            setError(t('invite.errorNotFound', 'This invitation link is invalid or expired.'));
          } else {
            if (inviteData.cafe_id) {
              const { data: cafeData, error: cafeError } = await supabase
                .from('cafes')
                .select('name, address')
                .eq('id', inviteData.cafe_id)
                .maybeSingle();
              if (!cafeError && cafeData) {
                (inviteData as InvitationWithCafe).cafe_name = cafeData.name;
                (inviteData as InvitationWithCafe).cafe_address = cafeData.address;
              }
            }
            setInvitation(inviteData as InvitationWithCafe);
            localStorage.setItem(`friend_invite_${token}`, JSON.stringify(inviteData));
          }
        } catch (err) {
          setError(t('invite.errorNotFound', 'This invitation link is invalid or expired.'));
        } finally {
          setDetailsLoading(false);
        }
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
      text: t('invite.shareText'),
      url: inviteLink,
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
      {/* <img src={happyGif} alt="Happy connect" className="mx-auto mb-6 w-40 sm:w-56 rounded-xl shadow-lg" style={{maxWidth:'100%'}} /> */}
      {/* <LoadingIndicator
        label={t("common.loading")}
        size="md"
        className="my-4"
      /> */}
      {/* <SkeletonLoader
        count={1}
        height="h-24"
        className="my-2"
        ariaLabel={t("common.loading")}
      /> */}
      {error && <div className="text-red-600 font-semibold text-lg mb-4">{error}</div>}
      {invitation && (
        <div className="mb-6 bg-primary-50 rounded-xl p-4 shadow-md">
          <div className="font-semibold text-lg text-primary-700 mb-2">
            {t('invite.detailsHeading', 'Here are the details for your meetup!')}
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">☕</span>
            <span className="font-bold text-xl">
              {invitation.cafe_name || t('invite.cafeInfoPending', 'Café will be revealed soon!')}
            </span>
            {invitation.cafe_address && (
              <span className="text-gray-700">{invitation.cafe_address}</span>
            )}
            {invitation?.date_time_options && invitation.date_time_options.length > 0 && (
              <div className="mt-4">
                <div className="font-semibold mb-1 text-primary-700">
                  {t('invite.allProposedTimes', 'All suggested dates & times:')}
                </div>
                <ul className="flex flex-col gap-2 items-center">
                  {invitation.date_time_options.map((opt, i) => (
                    <li key={i} className="text-primary-700">
                      <div className="font-mono bg-primary-100 rounded px-3 py-2">
                        <div className="font-bold">
                          {new Date(opt.date).toLocaleDateString(t('common.locale_code'), {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="flex gap-2 justify-center mt-1">
                          {(opt.times || []).map((time) => (
                            <span
                              key={time}
                              className="text-xs bg-primary-200 text-primary-800 px-2 py-0.5 rounded-full"
                            >
                              {t(`common.${time}`, time)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {detailsLoading && (
            <SkeletonLoader
              count={1}
              height="h-8"
              className="my-2"
              ariaLabel={t('common.loading')}
            />
          )}
        </div>
      )}

      {invitation && !error && (
        <>
          <div className="card bg-primary-50 mb-8 p-4 rounded-xl shadow-md">
            <p className="text-gray-700 mb-4 text-base sm:text-lg">
              {t(
                'invite.shareInstructions',
                'Share this link with your friend and let the coffee magic happen! ☕✨',
              )}
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
                {t('invite.share', 'Share the magic! ✨')}
              </button>
            ) : (
              <button
                onClick={handleCopy}
                className="btn-secondary w-full sm:w-auto py-3 px-6 text-lg rounded-lg"
                disabled={!inviteLink}
              >
                {t('invite.copyLink', 'Copy link & send! 📋')}
              </button>
            )}
          </div>
          {/* Verborgen input voor fallback kopiëren */}
          <input
            ref={inputRef}
            type="text"
            style={{
              position: 'absolute',
              left: '-9999px',
              width: 0,
              height: 0,
              opacity: 0,
            }}
            readOnly
          />
          {copyStatus === 'success' && (
            <div className="text-green-600 mt-2">{t('invite.copySuccess')}</div>
          )}
          {copyStatus === 'error' && (
            <div className="text-red-600 mt-2">{t('invite.copyError')}</div>
          )}
        </>
      )}
    </div>
  );
};

export default Invite;
