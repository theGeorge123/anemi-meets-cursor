import { supabase } from './supabaseClient';

export const fetchMeetupsForUser = (userId: string, email: string) =>
  supabase
    .from('invitations')
    .select('*')
    .or(`invitee_id.eq.${userId},email_b.eq."${email}",email_a.eq."${email}"`)
    .order('selected_date', { ascending: true });

export const insertInvitation = (payload: any) =>
  supabase.from('invitations').insert(payload).select();

export const checkInvitationTable = () =>
  supabase.from('invitations').select('count');

export const fetchInvitationByToken = (token: string) =>
  supabase.from('invitations').select('*').eq('token', token).maybeSingle();

export const fetchCafeById = (id: string) =>
  supabase
    .from('cafes')
    .select('name, address, image_url')
    .eq('id', id)
    .maybeSingle();

export const fetchCafesByCity = (city: string) =>
  supabase.from('cafes').select('*').eq('city', city);

export const fetchCities = () => supabase.from('cities').select('*');
