import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function encodeBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

export async function wantsReminders(
  supabase: ReturnType<typeof createClient>,
  email: string,
): Promise<boolean> {
  const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email);

  if (userError || !user) {
    return false;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('wantsReminders')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return false;
  }

  return !!profile?.wantsReminders;
}
