import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { userId, action, metadata } = await req.json()
  
  // Complex badge logic
  switch (action) {
    case 'check_meetup_badges':
      const { data: meetups, error } = await supabase
        .from('invitations')
        .select('id')
        .or(`invitee_id.eq.${userId},requester_id.eq.${userId}`)
        .eq('status', 'accepted');
      const meetupCount = meetups?.length || 0;
      if (meetupCount === 1) {
        await supabase.from('user_badges').insert({ user_id: userId, badge_key: 'first_meetup' }).select();
      } else if (meetupCount === 5) {
        await supabase.from('user_badges').insert({ user_id: userId, badge_key: 'five_meetups' }).select();
      }
      break;
    case 'check_activity_badges':
      // Add custom logic for activity badges
      break;
  }
  return new Response(JSON.stringify({ success: true }))
}) 