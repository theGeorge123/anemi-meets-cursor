import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const slots: Record<string, [string, string]> = {
  morning: ["09:00:00", "12:00:00"],
  afternoon: ["12:00:00", "17:00:00"],
  evening: ["17:00:00", "21:00:00"]
};

Deno.serve(async () => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing environment variables" }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  async function shouldSendReminder(email: string): Promise<boolean> {
    const { data: user } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (!user) return true;
    const { data: profile } = await supabase
      .from('profiles')
      .select('wants_reminders')
      .eq('id', user.id)
      .maybeSingle();
    return profile?.wants_reminders !== false;
  }

  const { data: invitations, error } = await supabase
    .from("invitations")
    .select("id, selected_date, selected_time, email_a, email_b")
    .eq("status", "accepted");

  if (error || !invitations) {
    return new Response(JSON.stringify({ error: error?.message || "No invitations" }), { status: 500 });
  }

  const now = new Date();

  for (const inv of invitations) {
    const slot = (inv.selected_time || "").toLowerCase();
    const [dtStart] = slots[slot] || [];
    if (!inv.selected_date || !dtStart) continue;

    const timeStr = dtStart;
    const meetingTime = new Date(`${inv.selected_date}T${timeStr}`);
    const diffHours = (meetingTime.getTime() - now.getTime()) / 36e5;

    if (Math.abs(diffHours - 24) <= 0.5 || Math.abs(diffHours - 1) <= 0.5) {
      const recipients: string[] = [];
      const [sendA, sendB] = await Promise.all([
        shouldSendReminder(inv.email_a),
        shouldSendReminder(inv.email_b)
      ]);
      if (sendA) recipients.push(inv.email_a);
      if (sendB) recipients.push(inv.email_b);

      if (recipients.length === 0) continue;

      const subject = Math.abs(diffHours - 24) <= 0.5
        ? "Coffee meetup in 24 hours!"
        : "Coffee meetup in 1 hour!";

      const html = `<p>Your coffee meetup is scheduled for ${inv.selected_date} at ${timeStr}.</p>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "noreply@anemimeets.com",
          to: recipients,
          subject,
          html
        })
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
