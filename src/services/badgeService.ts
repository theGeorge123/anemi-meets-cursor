import { supabase } from '../supabaseClient';
import type { Database, Badge, UserBadge } from '../types/supabase';

export async function getAllBadges(): Promise<Badge[]> {
  const { data } = await supabase.from('badges').select();
  return (data as Badge[]) || [];
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data } = await supabase.from('user_badges').select().eq('user_id', userId);
  return (data as UserBadge[]) || [];
}

export async function awardBadge(userId: string, badgeKey: string): Promise<void> {
  // Upsert ensures the badge is awarded only once per user
  await supabase.from('user_badges').upsert({ user_id: userId, badge_key: badgeKey });
}

export async function hasBadge(userId: string, badgeKey: string): Promise<boolean> {
  // Check if a user already has a specific badge
  const { data } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_key', badgeKey)
    .maybeSingle();
  return !!data;
}

export async function callAwardBadges(userId: string, action: string, metadata?: unknown) {
  // Call the edge function to award badges based on an action
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-badges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ userId, action, metadata }),
  });
  return res.json();
}
