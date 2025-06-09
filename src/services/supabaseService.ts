import { supabase } from '../supabaseClient';
import type { Database } from '../types/supabase';
import type { Badge, UserBadge } from '../types/supabase';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type InvitationInsert = Database['public']['Tables']['invitations']['Insert'];
export type InvitationRow = Database['public']['Tables']['invitations']['Row'];

export async function getProfile(userId: string) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
}

export async function createInvitation(payload: InvitationInsert) {
  return supabase
    .from('invitations')
    .insert(payload)
    .select()
    .single();
}

export async function getFriends(userId: string): Promise<ProfileRow[]> {
  // Get accepted friends for the user
  const { data: friendshipRows } = await supabase
    .from('friendships')
    .select('friend_id, status')
    .eq('user_id', userId);
  if (!friendshipRows) return [];
  const acceptedIds = friendshipRows.filter((f: { friend_id: string, status: string }) => f.status === 'accepted').map((f: { friend_id: string }) => f.friend_id);
  if (acceptedIds.length === 0) return [];
  const { data: friendProfiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', acceptedIds);
  return friendProfiles || [];
}

export async function getPendingFriends(userId: string): Promise<ProfileRow[]> {
  // Get pending friend requests sent by the user
  const { data: friendshipRows } = await supabase
    .from('friendships')
    .select('friend_id, status')
    .eq('user_id', userId);
  if (!friendshipRows) return [];
  const pendingIds = friendshipRows.filter((f: { friend_id: string, status: string }) => f.status === 'pending').map((f: { friend_id: string }) => f.friend_id);
  if (pendingIds.length === 0) return [];
  const { data: pendingProfiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', pendingIds);
  return pendingProfiles || [];
}

export async function getIncomingFriendRequests(userId: string): Promise<ProfileRow[]> {
  // Get incoming friend requests (where user is the target)
  const { data: incomingRows } = await supabase
    .from('friendships')
    .select('user_id')
    .eq('friend_id', userId)
    .eq('status', 'pending');
  if (!incomingRows) return [];
  const requesterIds = incomingRows.map((f: { user_id: string }) => f.user_id);
  if (requesterIds.length === 0) return [];
  const { data: requesterProfiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', requesterIds);
  return requesterProfiles || [];
}

export async function getAllBadges(): Promise<Badge[]> {
  const { data } = await supabase.from('badges').select('*');
  return data || [];
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data } = await supabase.from('user_badges').select('*').eq('user_id', userId);
  return data || [];
}

export async function awardBadge(userId: string, badgeKey: string): Promise<void> {
  await supabase.from('user_badges').upsert({ user_id: userId, badge_key: badgeKey });
}

export async function hasBadge(userId: string, badgeKey: string): Promise<boolean> {
  const { data } = await supabase.from('user_badges').select('id').eq('user_id', userId).eq('badge_key', badgeKey).maybeSingle();
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
  // Count confirmed meetups where user is invitee or email matches
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

export const service = {
  getProfile,
  createInvitation,
  getFriends,
  getPendingFriends,
  getIncomingFriendRequests,
  getAllBadges,
  getUserBadges,
  awardBadge,
  hasBadge,
  getFriendCount,
  getMeetupCount,
};

export default service;
