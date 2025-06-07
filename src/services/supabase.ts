import { supabase } from '../supabaseClient';

export interface ServiceError {
  message: string;
  code?: string;
}

export async function getProfile(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
  return data;
}

export async function createInvitation(data: any) {
  const { data: inserted, error } = await supabase
    .from('invitations')
    .insert(data)
    .select()
    .maybeSingle();
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
  return inserted;
}

export async function getInvitation(token: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
  return data;
}

export async function getCafe(id: string) {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
  return data;
}

export async function fetchCities() {
  const { data, error } = await supabase.from('cities').select('*');
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
  return data || [];
}

export async function fetchCafesByCity(city: string) {
  const { data, error } = await supabase.from('cafes').select('*').eq('city', city);
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
  return data || [];
}

export async function deleteFriendship(userId: string, friendId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', userId)
    .eq('friend_id', friendId);
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
}

export async function insertFriendInvite(inviterId: string, token: string) {
  const { error } = await supabase
    .from('friend_invites')
    .insert({ inviter_id: inviterId, invitee_email: '', token });
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
}

export async function checkFriendInviteToken(token: string) {
  const { data, error } = await supabase
    .from('friend_invites')
    .select('id')
    .eq('token', token)
    .maybeSingle();
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
  return data;
}

export async function updateFriendInviteAccept(token: string, email: string) {
  const { error } = await supabase
    .from('friend_invites')
    .update({ accepted: true, accepted_at: new Date().toISOString(), invitee_email: email })
    .eq('token', token);
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
}

export async function insertFriendships(rows: any[]) {
  const { error } = await supabase.from('friendships').insert(rows);
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
}

export async function insertFriendship(row: any) {
  const { error } = await supabase.from('friendships').insert(row);
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
}

export async function getFriendInvite(token: string) {
  const { data, error } = await supabase
    .from('friend_invites')
    .select('id, inviter_id, accepted')
    .eq('token', token)
    .maybeSingle();
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
  return data;
}

export async function getProfileByEmail(email: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', email)
    .maybeSingle();
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
  return data;
}

export async function checkExistingFriendship(userId: string, friendId: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id', userId)
    .eq('friend_id', friendId)
    .maybeSingle();
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
  return data;
}

export async function updateProfileEmoji(userId: string, emoji: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ emoji })
    .eq('id', userId);
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
}

export async function updateProfilePrefs(userId: string, prefs: { wants_updates: boolean; wants_reminders: boolean; wants_notifications: boolean; is_private: boolean }) {
  const { error } = await supabase
    .from('profiles')
    .update(prefs)
    .eq('id', userId);
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
}

export async function getUserMeetups(userId: string, email: string) {
  const { data, error } = await supabase
    .from('invitations')
    .select('id, selected_date, selected_time, cafe_id, cafe_name, status, email_b')
    .or(`invitee_id.eq.${userId},email_b.eq.${email}`);
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
  return data || [];
}

export async function checkInvitationAccess() {
  const { data, error } = await supabase.from('invitations').select('count');
  if (error) {
    throw { message: error.message, code: error.code } as ServiceError;
  }
  return data;
}
