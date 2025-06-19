import { supabase } from '../supabaseClient';
import type { Database } from '../types/supabase';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export async function getFriends(userId: string): Promise<ProfileRow[]> {
  // Get all friendships for the user
  const { data: friendshipRows } = await supabase
    .from('friendships')
    .select('friend_id, status')
    .eq('user_id', userId);
  if (!friendshipRows) return [];
  // Only include accepted friends
  const acceptedIds = friendshipRows.filter((f) => f.status === 'accepted').map((f) => f.friend_id);
  if (acceptedIds.length === 0) return [];
  // Fetch profile data for all accepted friends
  const { data: friendProfiles } = await supabase.from('profiles').select().in('id', acceptedIds);
  return (friendProfiles as ProfileRow[]) || [];
}

export async function getPendingFriends(userId: string): Promise<ProfileRow[]> {
  // Get all friendships for the user
  const { data: friendshipRows } = await supabase
    .from('friendships')
    .select('friend_id, status')
    .eq('user_id', userId);
  if (!friendshipRows) return [];
  // Only include pending friends
  const pendingIds = friendshipRows.filter((f) => f.status === 'pending').map((f) => f.friend_id);
  if (pendingIds.length === 0) return [];
  // Fetch profile data for all pending friends
  const { data: pendingProfiles } = await supabase.from('profiles').select().in('id', pendingIds);
  return (pendingProfiles as ProfileRow[]) || [];
}

export async function getFriendCount(userId: string): Promise<number> {
  // Count accepted friendships for the user
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

export async function removeFriend(userId: string, friendId: string) {
  // Remove both directions of the friendship
  const { error } = await supabase
    .from('friendships')
    .delete()
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`,
    );
  if (error) throw new Error('Kon vriend niet verwijderen. Probeer het straks nog eens!');
  return true;
}
