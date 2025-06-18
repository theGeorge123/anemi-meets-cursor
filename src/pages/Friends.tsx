import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import LoadingIndicator from '../components/LoadingIndicator';
import Toast from '../components/Toast';
import { getFriends, acceptFriendRequest, rejectFriendRequest, removeFriend } from '../services/supabaseService';
import type { Profile } from '../types/supabase';

interface User {
  id: string;
  email: string;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
}

const Friends = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [sendError, setSendError] = useState('');
  const [pendingSent, setPendingSent] = useState<FriendRequest[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendRequest[]>([]);
  const [sentProfiles, setSentProfiles] = useState<Record<string, Profile>>({});
  const [receivedProfiles, setReceivedProfiles] = useState<Record<string, Profile>>({});
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ id: user.id, email: user.email ?? '' });
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Fetch pending sent requests
    supabase.from('friend_requests')
      .select('*')
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .then(async ({ data }) => {
        setPendingSent((data as FriendRequest[]) || []);
        // Fetch addressee profiles
        if (data && data.length > 0) {
          const ids = data.map((r: FriendRequest) => r.addressee_id);
          const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
          const map: Record<string, Profile> = {};
          (profiles || []).forEach((p: Profile) => { map[p.id] = p; });
          setSentProfiles(map);
        } else {
          setSentProfiles({});
        }
      });
    // Fetch pending received requests
    supabase.from('friend_requests')
      .select('*')
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
      .then(async ({ data }) => {
        setPendingReceived((data as FriendRequest[]) || []);
        // Fetch requester profiles
        if (data && data.length > 0) {
          const ids = data.map((r: FriendRequest) => r.requester_id);
          const { data: profiles } = await supabase.from('profiles').select('*').in('id', ids);
          const map: Record<string, Profile> = {};
          (profiles || []).forEach((p: Profile) => { map[p.id] = p; });
          setReceivedProfiles(map);
        } else {
          setReceivedProfiles({});
        }
      });
    // Fetch friends (accepted requests)
    getFriends(user.id).then(setFriends);
    setLoading(false);
  }, [user, sendStatus, toast]);

  const handleSendRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSendStatus('loading');
    setSendError('');
    if (!user) return;
    // Find user by email
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (error || !profile) {
      setSendStatus('error');
      setSendError(t('friends.errorNoUser', 'No user found with that email.'));
      setToast({ message: t('friends.errorNoUser', 'No user found with that email.'), type: 'error' });
      return;
    }
    // Send request
    const { error: reqError } = await supabase
      .from('friend_requests')
      .insert({ requester_id: user.id, addressee_id: profile.id });
    if (reqError) {
      setSendStatus('error');
      setSendError(reqError.message);
      setToast({ message: reqError.message, type: 'error' });
    } else {
      setSendStatus('success');
      setEmail('');
      setToast({ message: t('friends.requestSent'), type: 'success' });
    }
  };

  const getFriendlyError = (err: any, t: any) => {
    if (!err) return t('friends.errorAction', 'Something went wrong.');
    const msg = err.message || String(err);
    if (msg.includes('RLS') || msg.includes('row level security')) {
      return t('friends.errorRLS', 'You do not have permission to perform this action.');
    }
    if (msg.includes('already accepted')) {
      return t('friends.errorAlreadyAccepted', 'This request was already accepted.');
    }
    if (msg.includes('network') || msg.includes('Failed to fetch')) {
      return t('friends.errorNetwork', 'Network error. Please try again.');
    }
    return msg;
  };

  const handleRespond = async (id: string, accept: boolean) => {
    try {
      if (accept) {
        await acceptFriendRequest(id);
        setToast({ message: t('friends.accepted', 'Friend request accepted!'), type: 'success' });
      } else {
        await rejectFriendRequest(id);
        setToast({ message: t('friends.rejected', 'Friend request rejected.'), type: 'info' });
      }
      setSendStatus('idle');
    } catch (err: any) {
      console.error('Friend request action failed:', err);
      setToast({ message: getFriendlyError(err, t), type: 'error' });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    try {
      await removeFriend(user.id, friendId);
      setToast({ message: t('friends.removed', 'Friend removed.'), type: 'success' });
      setFriends(friends.filter(f => f.id !== friendId));
    } catch (err: any) {
      setToast({ message: err.message || t('friends.errorRemove', 'Could not remove friend.'), type: 'error' });
    }
  };

  return (
    <main className="max-w-xl mx-auto py-8 px-2">
      <h1 className="text-3xl font-extrabold mb-6 text-primary-700 flex items-center gap-2">
        ☕️ {t('friends.title')}
      </h1>
      {/* Send Friend Request */}
      <form onSubmit={handleSendRequest} className="mb-6 flex flex-col sm:flex-row gap-2 items-center bg-yellow-50 rounded-xl p-4 shadow">
        <input
          type="email"
          className="input-field flex-1"
          placeholder={t('friends.emailPlaceholder')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary min-w-[120px]" disabled={sendStatus==='loading'}>
          {sendStatus==='loading' ? <LoadingIndicator size="sm" /> : t('friends.sendRequest')}
        </button>
      </form>
      {sendStatus==='error' && <div className="text-red-600 mb-4">{sendError}</div>}
      {sendStatus==='success' && <div className="text-green-600 mb-4 animate-bounce">{t('friends.requestSent')}</div>}
      {/* Pending Requests */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">⏳ {t('friends.pending')}</h2>
        {loading ? <LoadingIndicator /> : (
          <>
            <div className="mb-2 font-medium">{t('friends.sent')}:</div>
            {pendingSent.length === 0 ? (
              <div className="text-gray-500 mb-2 italic">😶 {t('friends.none')}</div>
            ) : (
              <ul className="mb-4">
                {pendingSent.map(req => {
                  const profile = sentProfiles[req.addressee_id];
                  return (
                    <li key={req.id} className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-primary-700">{profile ? (profile.fullName || profile.email) : req.addressee_id}</span>
                      <span className="text-yellow-600 text-xs">⏳</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mb-2 font-medium">{t('friends.received')}:</div>
            {pendingReceived.length === 0 ? (
              <div className="text-gray-500 italic">🕵️‍♂️ {t('friends.none')}</div>
            ) : (
              <ul>
                {pendingReceived.map(req => {
                  const profile = receivedProfiles[req.requester_id];
                  return (
                    <li key={req.id} className="mb-2 flex items-center gap-2">
                      <span className="font-mono text-primary-700">{profile ? (profile.fullName || profile.email) : req.requester_id}</span>
                      <button className="btn-primary btn-xs" onClick={() => handleRespond(req.id, true)}>{t('friends.accept')}</button>
                      <button className="btn-secondary btn-xs" onClick={() => handleRespond(req.id, false)}>{t('friends.reject')}</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>
      {/* Friends List */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">🎉 {t('friends.list')}</h2>
        {loading ? <LoadingIndicator /> : (
          friends.length === 0 ? (
            <div className="text-gray-500 italic">🥲 {t('friends.none')}</div>
          ) : (
            <ul>
              {friends.map(f => (
                <li key={f.id} className="mb-1 flex items-center gap-2">
                  <span className="text-2xl">{f.emoji || '👤'}</span>
                  <span className="font-bold text-primary-700">{f.fullName || f.email}</span>
                  <button className="btn-secondary btn-xs ml-2" onClick={() => handleRemoveFriend(f.id)}>{t('friends.remove', 'Remove')}</button>
                </li>
              ))}
            </ul>
          )
        )}
      </section>
      {/* Block/Privacy UI (optional, not functional) */}
      <section>
        <h2 className="text-lg font-semibold mb-2">🚫 {t('friends.block')}</h2>
        <div className="text-gray-400 italic">{t('friends.blockDesc')}</div>
      </section>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          position="bottom-right"
        />
      )}
    </main>
  );
};

export default Friends; 