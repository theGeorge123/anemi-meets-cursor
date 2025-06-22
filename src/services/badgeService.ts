import { supabase } from '../supabaseClient';
import type { Database } from '../types/supabase';

export type UserBadgeRow = Database['public']['Tables']['user_badges']['Row'];

export async function hasBadge(userId: string, badgeKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_key', badgeKey)
    .maybeSingle();

  if (error) {
    console.error('Error checking badge:', error);
    return false;
  }

  return !!data;
}

export async function awardBadge(userId: string, badgeKey: string): Promise<void> {
  const { error } = await supabase
    .from('user_badges')
    .insert({ user_id: userId, badge_key: badgeKey });

  if (error) {
    console.error('Error awarding badge:', error);
  }
}
