import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import LoadingIndicator from '../components/LoadingIndicator';

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

interface Friend {
  friend_id: string;
}

const Friends = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [sendError, setSendError] = useState('');
  const [pendingSent, setPendingSent] = useState<FriendRequest[]>([]);
  const [pendingReceived, setPendingReceived] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  // Optional: block list UI
  const [blockList, setBlockList] = useState<any[]>([]);

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
      .then(({ data }) => setPendingSent((data as FriendRequest[]) || []));
    // Fetch pending received requests
    supabase.from('friend_requests')
      .select('*')
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
      .then(({ data }) => setPendingReceived((data as FriendRequest[]) || []));
    // Fetch friends (accepted requests)
    supabase.rpc('get_friends_for_user', { uid_param: user.id })
      .then(({ data }) => setFriends((data as Friend[]) || []));
    setLoading(false);
  }, [user, sendStatus]);

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
      return;
    }
    // Send request
    const { error: reqError } = await supabase
      .from('friend_requests')
      .insert({ requester_id: user.id, addressee_id: profile.id });
    if (reqError) {
      setSendStatus('error');
      setSendError(reqError.message);
    } else {
      setSendStatus('success');
      setEmail('');
    }
  };

  const handleRespond = async (id: string, accept: boolean) => {
    await supabase
      .from('friend_requests')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', id);
    setSendStatus('idle');
  };

  return (
    <main className="max-w-xl mx-auto py-8 px-2">
      <h1 className="text-2xl font-bold mb-6">{t('friends.title', 'Friends & Requests')}</h1>
      {/* Send Friend Request */}
      <form onSubmit={handleSendRequest} className="mb-6 flex flex-col sm:flex-row gap-2 items-center">
        <input
          type="email"
          className="input-field flex-1"
          placeholder={t('friends.emailPlaceholder', "Friend's email")}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary min-w-[120px]" disabled={sendStatus==='loading'}>
          {sendStatus==='loading' ? <LoadingIndicator size="sm" /> : t('friends.sendRequest', 'Send Request')}
        </button>
      </form>
      {sendStatus==='error' && <div className="text-red-600 mb-4">{sendError}</div>}
      {sendStatus==='success' && <div className="text-green-600 mb-4">{t('friends.requestSent', 'Request sent!')}</div>}
      {/* Pending Requests */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">{t('friends.pending', 'Pending Requests')}</h2>
        {loading ? <LoadingIndicator /> : (
          <>
            <div className="mb-2 font-medium">{t('friends.sent', 'Sent')}:</div>
            {pendingSent.length === 0 ? <div className="text-gray-500 mb-2">{t('friends.none', 'None')}</div> : (
              <ul className="mb-4">
                {pendingSent.map(req => (
                  <li key={req.id} className="mb-1">{req.addressee_id}</li>
                ))}
              </ul>
            )}
            <div className="mb-2 font-medium">{t('friends.received', 'Received')}:</div>
            {pendingReceived.length === 0 ? <div className="text-gray-500">{t('friends.none', 'None')}</div> : (
              <ul>
                {pendingReceived.map(req => (
                  <li key={req.id} className="mb-2 flex items-center gap-2">
                    {req.requester_id}
                    <button className="btn-primary btn-xs" onClick={() => handleRespond(req.id, true)}>{t('friends.accept', 'Accept')}</button>
                    <button className="btn-secondary btn-xs" onClick={() => handleRespond(req.id, false)}>{t('friends.reject', 'Reject')}</button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
      {/* Friends List */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">{t('friends.list', 'Your Friends')}</h2>
        {loading ? <LoadingIndicator /> : (
          friends.length === 0 ? <div className="text-gray-500">{t('friends.none', 'No friends yet!')}</div> : (
            <ul>
              {friends.map(f => (
                <li key={f.friend_id} className="mb-1">{f.friend_id}</li>
              ))}
            </ul>
          )
        )}
      </section>
      {/* Block/Privacy UI (optional, not functional) */}
      <section>
        <h2 className="text-lg font-semibold mb-2">{t('friends.block', 'Blocked Users (coming soon)')}</h2>
        <div className="text-gray-400">{t('friends.blockDesc', 'You will be able to block users here in the future.')}</div>
      </section>
    </main>
  );
};

export default Friends; 