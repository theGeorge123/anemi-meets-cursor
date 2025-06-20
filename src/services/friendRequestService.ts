import { supabase } from '../supabaseClient';
import type { Database } from '../types/supabase';

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .insert({ requester_id: requesterId, addressee_id: addresseeId })
    .select()
    .single();
  if (error)
    throw new Error('Oeps! Je verzoek kon niet worden verstuurd. Probeer het straks nog eens ☕️');
  return data as Database['public']['Tables']['friend_requests']['Row'];
}

export async function getOutgoingFriendRequests(userId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select()
    .eq('requester_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Kon je verzonden verzoeken niet ophalen. Even opnieuw proberen?');
  return (data as Database['public']['Tables']['friend_requests']['Row'][]) || [];
}

export async function getIncomingFriendRequests(userId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select()
    .eq('addressee_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error('Kon je ontvangen verzoeken niet ophalen. Even opnieuw proberen?');
  return (data as Database['public']['Tables']['friend_requests']['Row'][]) || [];
}

export async function acceptFriendRequest(requestId: string) {
  // Mark the friend request as accepted
  const { data, error } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw new Error('Kon het verzoek niet accepteren. Probeer het straks nog eens!');
  // Create a two-way friendship (A->B and B->A) if not already present
  const { requester_id, addressee_id } =
    data as Database['public']['Tables']['friend_requests']['Row'];
  await supabase.from('friendships').upsert(
    [
      { user_id: requester_id, friend_id: addressee_id, status: 'accepted' },
      { user_id: addressee_id, friend_id: requester_id, status: 'accepted' },
    ],
    { onConflict: 'user_id,friend_id' },
  );
  return data;
}

export async function rejectFriendRequest(requestId: string) {
  // Mark the friend request as rejected
  const { data, error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw new Error('Kon het verzoek niet weigeren. Probeer het straks nog eens!');
  return data as Database['public']['Tables']['friend_requests']['Row'];
}
