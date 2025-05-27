import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import happyGif from '../assets/happy-connect.gif';

const Invite = () => {
  const { t } = useTranslation();
  const [inviteLink, setInviteLink] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { token } = useParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      setInviteLink(`${window.location.origin}/respond?token=${token}`);
      // Haal de uitnodiging op
      (async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('invitations')
          .select('selected_date, selected_time, cafe_id')
          .eq('token', token)
          .single();
        if (error || !data) {
          setError('Oeps! We konden je uitnodiging niet vinden. Controleer je link of neem contact op.');
        } else {
          setInvitation(data);
        }
        setLoading(false);
      })();
    }
  }, [token]);

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

  return (
    <div className="max-w-2xl mx-auto text-center px-2 sm:px-4 py-6">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary-600 mb-4">
        Hey, je bent al een stapje dichterbij het connecten! 🎉
      </h1>
      <img src={happyGif} alt="Happy connect" className="mx-auto mb-6 w-40 sm:w-56 rounded-xl shadow-lg" style={{maxWidth:'100%'}} />
      {loading && <div className="text-lg text-primary-700">Uitnodiging laden...</div>}
      {error && <div className="text-red-600 font-semibold text-lg mb-4">{error}</div>}
      {invitation && (
        <div className="mb-6 bg-primary-50 rounded-xl p-4 shadow-md">
          <div className="font-semibold text-lg text-primary-700 mb-2">Afspraakgegevens</div>
          <div className="mb-1">Datum: <span className="font-mono">{invitation.selected_date}</span></div>
          <div className="mb-1">Tijd: <span className="font-mono">{invitation.selected_time}</span></div>
          {invitation.cafe_id ? (
            <div className="mb-1">Café: <span className="font-mono">{invitation.cafe_id}</span></div>
          ) : (
            <div className="mb-1 text-gray-500">Café-informatie volgt na bevestiging!</div>
          )}
        </div>
      )}
      
      <div className="card bg-primary-50 mb-8 p-4 rounded-xl shadow-md">
        <p className="text-gray-700 mb-4 text-base sm:text-lg">
          Deel deze link met je koffie-buddy zodat jullie samen kunnen plannen:
        </p>
        
        <div className="bg-white p-4 rounded-lg border border-primary-200 overflow-x-auto">
          <code className="text-primary-600 break-all text-sm sm:text-base">
            {inviteLink || '...'}
          </code>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className="btn-secondary w-full sm:w-auto py-3 px-6 text-lg rounded-lg"
        disabled={!inviteLink}
      >
        Copy Link
      </button>
      {/* Verborgen input voor fallback kopiëren */}
      <input
        ref={inputRef}
        type="text"
        style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, opacity: 0 }}
        readOnly
      />
      {copyStatus === 'success' && (
        <div className="text-green-600 mt-2">Link gekopieerd!</div>
      )}
      {copyStatus === 'error' && (
        <div className="text-red-600 mt-2">Kopiëren mislukt. Probeer handmatig.</div>
      )}
    </div>
  );
};

export default Invite; 