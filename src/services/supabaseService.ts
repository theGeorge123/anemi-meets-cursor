import { supabase } from '../supabaseClient';
import type { Database } from '../types/supabase';

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

export const service = {
  getProfile,
  createInvitation,
};

export default service;
