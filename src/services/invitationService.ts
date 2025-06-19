import { supabase } from '../supabaseClient';
import type { Database } from '../types/supabase';

export type InvitationInsert = Database['public']['Tables']['invitations']['Insert'];
export type InvitationRow = Database['public']['Tables']['invitations']['Row'];

export async function createInvitation(payload: InvitationInsert) {
  return supabase.from('invitations').insert(payload).select().single();
}

export async function getMeetupCount(userId: string): Promise<number> {
  // Count confirmed invitations where the user is either the invitee or their email matches email_b
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
