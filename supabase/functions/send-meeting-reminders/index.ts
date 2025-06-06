import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Reminder flags store the time a reminder email was sent as an ISO timestamp.
 * If `reminded_24h` or `reminded_1h` is null, that reminder hasn't been sent yet.
 */
Deno.serve(async (_req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!SUPABASE_URL || !SERVICE_KEY || !RESEND_API_KEY) {
    return new Response("Missing environment variables", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const now = new Date();

  // Compute cut-offs for 24h and 1h reminders
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);

  const date24 = in24h.toISOString().split("T")[0];
  const date1 = in1h.toISOString().split("T")[0];

  // Fetch invitations needing reminders
  const { data, error } = await supabase
    .from("invitations")
    .select(
      "id, email_a, email_b, selected_date, selected_time, cafe_id, reminded_24h, reminded_1h"
    )
    .or(
      `and(selected_date.eq.${date24},reminded_24h.is.null),and(selected_date.eq.${date1},reminded_1h.is.null)`
    );

  if (error || !data) {
    console.error("Fetch error", error?.message);
    return new Response("Failed to fetch invitations", { status: 500 });
  }

  for (const inv of data) {
    const recipients = [inv.email_a, inv.email_b].filter(Boolean);
    if (recipients.length === 0) continue;

    const when = inv.selected_time
      ? `${inv.selected_date} (${inv.selected_time})`
      : inv.selected_date;

    const html = `<p>Your meetup at cafe ${inv.cafe_id} is scheduled for ${when}.</p>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@anemimeets.com",
        to: recipients,
        subject: "Coffee meetup reminder",
        html,
      }),
    });

    if (!res.ok) {
      console.error("Email send failed", await res.text());
      continue;
    }

    // Update reminder timestamp to avoid duplicates
    const update: Record<string, string> = {};
    if (inv.selected_date === date24 && inv.reminded_24h == null) {
      update.reminded_24h = new Date().toISOString();
    }
    if (inv.selected_date === date1 && inv.reminded_1h == null) {
      update.reminded_1h = new Date().toISOString();
    }

    await supabase.from("invitations").update(update).eq("id", inv.id);
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
