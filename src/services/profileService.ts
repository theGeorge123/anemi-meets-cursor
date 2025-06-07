import { supabase } from './supabaseClient';

export const fetchProfile = (id: string) =>
  supabase.from('profiles').select('*').eq('id', id).maybeSingle();

export const updateProfile = (id: string, updates: Record<string, any>) =>
  supabase.from('profiles').update(updates).eq('id', id);

export const updateLastSeen = (id: string) =>
  supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', id);

export const fetchProfiles = (ids: string[]) =>
  supabase.from('profiles').select('id, full_name, emoji, email').in('id', ids);

export const fetchProfileByEmail = (email: string) =>
  supabase.from('profiles').select('*').ilike('email', email).maybeSingle();
