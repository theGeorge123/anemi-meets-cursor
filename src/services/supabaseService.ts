import { supabase } from '../supabaseClient';
import type { Database } from '../types/supabase';
import type { Badge, UserBadge } from '../types/supabase';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type InvitationInsert = Database['public']['Tables']['invitations']['Insert'];
export type InvitationRow = Database['public']['Tables']['invitations']['Row'];

export async function getProfile(userId: string) {
  return supabase
    .from('profiles')
    .select<ProfileRow>()
    .eq('id', userId)
    .maybeSingle();
}

export async function createInvitation(payload: InvitationInsert) {
  return supabase
    .from('invitations')
    .insert(payload)
    .select<InvitationRow>()
    .single();
}

export async function getFriends(userId: string): Promise<ProfileRow[]> {
  const { data: friendshipRows } = await supabase
    .from('friendships')
    .select<{ friend_id: string, status: string }>('friend_id, status')
    .eq('user_id', userId);
  if (!friendshipRows) return [];
  const acceptedIds = friendshipRows.filter(f => f.status === 'accepted').map(f => f.friend_id);
  if (acceptedIds.length === 0) return [];
  const { data: friendProfiles } = await supabase
    .from('profiles')
    .select<ProfileRow>()
    .in('id', acceptedIds);
  return friendProfiles || [];
}

export async function getPendingFriends(userId: string): Promise<ProfileRow[]> {
  const { data: friendshipRows } = await supabase
    .from('friendships')
    .select<{ friend_id: string, status: string }>('friend_id, status')
    .eq('user_id', userId);
  if (!friendshipRows) return [];
  const pendingIds = friendshipRows.filter(f => f.status === 'pending').map(f => f.friend_id);
  if (pendingIds.length === 0) return [];
  const { data: pendingProfiles } = await supabase
    .from('profiles')
    .select<ProfileRow>()
    .in('id', pendingIds);
  return pendingProfiles || [];
}

export async function getAllBadges(): Promise<Badge[]> {
  const { data } = await supabase.from('badges').select<Badge>();
  return data || [];
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data } = await supabase.from('user_badges').select<UserBadge>().eq('user_id', userId);
  return data || [];
}

export async function awardBadge(userId: string, badgeKey: string): Promise<void> {
  await supabase.from('user_badges').upsert({ user_id: userId, badge_key: badgeKey });
}

export async function hasBadge(userId: string, badgeKey: string): Promise<boolean> {
  const { data } = await supabase.from('user_badges').select<{ id: number }>('id').eq('user_id', userId).eq('badge_key', badgeKey).maybeSingle();
  return !!data;
}

export async function getFriendCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'accepted');
  if (error) {
    console.error('Error fetching friend count:', error);
  }
  return count ?? 0;
}

export async function getMeetupCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('invitations')
    .select('id', { count: 'exact', head: true })
    .or(`invitee_id.eq.${userId},email_b.eq."${userId}"`)
    .eq('status', 'confirmed');
  if (error) {
    console.error('Error fetching meetup count:', error);
  }
  return count ?? 0;
}

export async function sendFriendRequest(addresseeId: string) {
  const { data, error } = await supabase.from('friend_requests').insert({ addressee_id: addresseeId }).select<Database['public']['Tables']['friend_requests']['Row']>().single();
  if (error) throw new Error("Oeps! Je verzoek kon niet worden verstuurd. Probeer het straks nog eens ☕️");
  return data;
}

export async function getOutgoingFriendRequests(userId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select<Database['public']['Tables']['friend_requests']['Row']>()
    .eq('requester_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error("Kon je verzonden verzoeken niet ophalen. Even opnieuw proberen?");
  return data || [];
}

export async function getIncomingFriendRequests(userId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select<Database['public']['Tables']['friend_requests']['Row']>()
    .eq('addressee_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error("Kon je ontvangen verzoeken niet ophalen. Even opnieuw proberen?");
  return data || [];
}

export async function acceptFriendRequest(requestId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .select<Database['public']['Tables']['friend_requests']['Row']>()
    .single();
  if (error) throw new Error("Kon het verzoek niet accepteren. Probeer het straks nog eens!");
  const { requester_id, addressee_id } = data;
  await supabase.from('friendships').upsert([
    { user_id: requester_id, friend_id: addressee_id, status: 'accepted' },
    { user_id: addressee_id, friend_id: requester_id, status: 'accepted' },
  ], { onConflict: 'user_id,friend_id' });
  return data;
}

export async function rejectFriendRequest(requestId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .select<Database['public']['Tables']['friend_requests']['Row']>()
    .single();
  if (error) throw new Error("Kon het verzoek niet weigeren. Probeer het straks nog eens!");
  return data;
}

export async function callAwardBadges(userId: string, action: string, metadata?: any) {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-badges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ userId, action, metadata })
  });
  return res.json();
}

export async function removeFriend(userId: string, friendId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
  if (error) throw new Error("Kon vriend niet verwijderen. Probeer het straks nog eens!");
  return true;
}

const supabaseService = {
  getProfile,
  createInvitation,
  getFriends,
  getPendingFriends,
  getAllBadges,
  getUserBadges,
  awardBadge,
  hasBadge,
  getFriendCount,
  getMeetupCount,
  sendFriendRequest,
  getOutgoingFriendRequests,
  getIncomingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  callAwardBadges,
  removeFriend,
};

export default supabaseService;
