import { supabase } from '../supabaseClient';
import type { Database } from '../types/supabase';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export async function getProfile(userId: string) {
  return supabase.from('profiles').select().eq('id', userId).maybeSingle();
}
