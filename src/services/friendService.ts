import { supabase } from './supabaseClient';

export const fetchFriendInvites = (token: string) =>
  supabase.from('friend_invites').select('id, inviter_id, accepted').eq('token', token).maybeSingle();

export const createFriendships = (inviterId: string, inviteeId: string) =>
  supabase.from('friendships').insert([
    { user_id: inviterId, friend_id: inviteeId, status: 'pending' },
    { user_id: inviteeId, friend_id: inviterId, status: 'accepted' }
  ]);

export const markInviteAccepted = (token: string, email: string) =>
  supabase.from('friend_invites').update({ accepted: true, accepted_at: new Date().toISOString(), invitee_email: email }).eq('token', token);

export const fetchFriendships = (userId: string) =>
  supabase.from('friendships').select('friend_id, status').eq('user_id', userId);

export const removeFriendship = (userId: string, friendId: string) =>
  supabase.from('friendships').delete().eq('user_id', userId).eq('friend_id', friendId);

export const createInvite = (inviterId: string, token: string) =>
  supabase.from('friend_invites').insert({ inviter_id: inviterId, invitee_email: '', token });

export const findInviteByToken = (token: string) =>
  supabase.from('friend_invites').select('id').eq('token', token).maybeSingle();
