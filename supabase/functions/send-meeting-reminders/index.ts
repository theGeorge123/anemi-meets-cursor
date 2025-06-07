import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function encodeBase64(str: string) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function wantsReminders(
  supabase: ReturnType<typeof createClient>,
  email: string
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

const slots: Record<string, [string, string]> = {
  morning: ["T090000", "T120000"],
  afternoon: ["T120000", "T170000"],
  evening: ["T170000", "T210000"],
};
const slotReadable: Record<string, string> = {
  morning: "09:00 – 12:00",
  afternoon: "12:00 – 17:00",
  evening: "17:00 – 21:00",
};

Deno.cron(
  "send-meeting-reminders",
  "0 9 * * *",
  async () => {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      console.error("Missing environment variables for reminders");
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const nowDate = new Date();
    const today = nowDate.toISOString().split("T")[0];
    const tomorrow = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: invitations, error } = await supabase
      .from("invitations")
      .select(
        "id, token, email_a, email_b, selected_date, selected_time, cafe_id, reminded_24h, reminded_1h"
      )
      .eq("status", "accepted")
      .gte("selected_date", today)
      .lte("selected_date", tomorrow);

    if (error) {
      console.error("Failed to fetch invitations", error.message);
      return;
    }

    if (!invitations) return;

    const now = new Date();

    for (const inv of invitations) {
      if (!inv.email_a || !inv.email_b || !inv.selected_date || !inv.selected_time) continue;
      const slot = String(inv.selected_time).toLowerCase();
      const [dtStart] = slots[slot] || slots["morning"];
      const startTime = new Date(
        `${inv.selected_date}T${dtStart.slice(1, 3)}:${dtStart.slice(3, 5)}:${dtStart.slice(5)}`,
      );
      const diffMs = startTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const needs24h = diffHours <= 24 && diffHours > 1 && !inv.reminded_24h;
      const needs1h = diffHours <= 1 && diffHours > 0 && !inv.reminded_1h;

      if (!needs24h && !needs1h) continue;

      const { data: cafe, error: cafeErr } = await supabase
        .from("cafes")
        .select("name, address, image_url")
        .eq("id", inv.cafe_id)
        .single();

      if (cafeErr || !cafe) {
        console.error("Cafe fetch error", cafeErr?.message);
        continue;
      }

      const datePart = inv.selected_date.replace(/-/g, "");
      const [_, dtEnd] = slots[slot] || slots["morning"];
      const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Koffie Meetup\nDTSTART:${datePart}${dtStart}\nDTEND:${datePart}${dtEnd}\nDESCRIPTION:Jullie koffie-afspraak!\nLOCATION:${cafe.name} ${cafe.address}\nEND:VEVENT\nEND:VCALENDAR`;
      const cafeImageUrl =
        cafe.image_url ||
        `https://source.unsplash.com/600x300/?coffee,${encodeURIComponent(cafe.name)}`;
      const readableTime = slotReadable[slot] || slotReadable["morning"];
      const subject = needs1h
        ? `☕️ Your meetup starts in about an hour!`
        : `☕️ Reminder: coffee meetup tomorrow!`;
      const html = `
        <h2>☕️ Your coffee meetup is coming up!</h2>
        <img src="${cafeImageUrl}" alt="Cafe" width="100%" style="max-width:600px;border-radius:12px;" />
        <p>You'll meet at <b>${cafe.name}</b> (${cafe.address})</p>
        <p>Time: ${readableTime} on ${inv.selected_date}</p>`;

      const recipients: string[] = [];
      if (await wantsReminders(supabase, inv.email_a)) recipients.push(inv.email_a);
      if (await wantsReminders(supabase, inv.email_b)) recipients.push(inv.email_b);
      if (recipients.length === 0) continue;

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@anemimeets.com",
          to: recipients,
          subject,
          html,
          attachments: [
            { filename: "meeting.ics", content: encodeBase64(ics), type: "text/calendar" },
          ],
        }),
      });

      if (!emailRes.ok) {
        console.error("Failed to send reminder", await emailRes.text());
        continue;
      }

      const updates: Record<string, string> = {};
      if (needs24h) updates.reminded_24h = new Date().toISOString();
      if (needs1h) updates.reminded_1h = new Date().toISOString();

      await supabase.from("invitations").update(updates).eq("id", inv.id);
    }
  }
);
