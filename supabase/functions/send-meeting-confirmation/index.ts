import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log, logError, retry } from "../_utils/logger.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST requests allowed." }), {
      status: 405,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      throw new Error("Missing environment variables.");
    }

    const { token, email_b, selected_date, selected_time, lang = "nl" } = await req.json();
    const isEnglish = lang === "en";
    if (!token || !email_b || !selected_date || !selected_time) {
      throw new Error("Missing required fields.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check invitation first to validate email and status
    const { data: existing, error: fetchError } = await retry(() =>
      supabase
        .from("invitations")
        .select("email_b, status, email_a, cafe_id")
        .eq("token", token)
        .single()
    );

    if (fetchError || !existing) {
      throw new Error(fetchError?.message || "Invitation not found.");
    }

    if (existing.status === "accepted") {
      throw new Error("Invitation already used.");
    }

    if (existing.email_b && existing.email_b !== email_b) {
      throw new Error("Email does not match invitation.");
    }

    const { data: invitation, error } = await retry(() =>
      supabase
        .from("invitations")
        .update({ email_b, selected_date, selected_time, status: "accepted" })
        .eq("token", token)
        .select()
        .single()
    );

    if (error || !invitation) throw new Error(error?.message || "Could not update invitation.");

    const { email_a, cafe_id } = invitation;
    if (!email_a || !cafe_id) throw new Error("Missing email_a or cafe_id.");

    const { data: cafe, error: cafeError } = await retry(() =>
      supabase
        .from("cafes")
        .select("name, address, image_url")
        .eq("id", cafe_id)
        .single()
    );

    if (cafeError || !cafe) throw new Error("Cafe not found.");

    const slots = {
      morning: ["T090000", "T120000"],
      afternoon: ["T120000", "T170000"],
      evening: ["T170000", "T210000"]
    };
    const readable = {
      morning: "09:00 – 12:00",
      afternoon: "12:00 – 17:00",
      evening: "17:00 – 21:00"
    };

    const slot = selected_time.toLowerCase();
    const [dtStart, dtEnd] = slots[slot] || slots["morning"];
    const readableTime = readable[slot] || readable["morning"];
    const datePart = selected_date.replace(/-/g, "");
    const uid = crypto.randomUUID();
    const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${uid}\nDTSTAMP:${dtStamp}\nSUMMARY:Koffie Meetup\nDTSTART:${datePart}${dtStart}\nDTEND:${datePart}${dtEnd}\nDESCRIPTION:Jullie koffie-afspraak!\nLOCATION:${cafe.name} ${cafe.address}\nEND:VEVENT\nEND:VCALENDAR`;
    const icsBase64 = encodeBase64(ics);

    const cafeImageUrl = cafe.image_url || `https://source.unsplash.com/600x300/?coffee,${encodeURIComponent(cafe.name)}`;
    const gcalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Koffie Meetup via Anemi")}&dates=${datePart}${dtStart}/${datePart}${dtEnd}&location=${encodeURIComponent(`${cafe.name} ${cafe.address}`)}`;

    const nameA = email_a.split('@')[0];
    const subject = isEnglish
      ? `☕️ ${nameA} just booked coffee with you!`
      : `☕️ ${nameA} heeft een koffie-date gepland!`;

    const html = `
      <h2>${isEnglish ? "☕️ Yes! Your coffee meetup is set!" : "☕️ Yes! Jullie koffie-date staat!"}</h2>
      <img src="${cafeImageUrl}" alt="Cafe" width="100%" style="max-width:600px;border-radius:12px;" />
      <p>${isEnglish ? "Hey legends!" : "Hey toppers!"}<br>
      ${isEnglish ? "You're meeting at" : "Jullie hebben afgesproken bij"} <b>${cafe.name}</b>.<br>
      <b>${isEnglish ? "Address" : "Adres"}:</b> ${cafe.address}<br>
      <b>${isEnglish ? "Time" : "Tijd"}:</b> ${readableTime} on ${selected_date}</p>
      <p><a href="${gcalUrl}" target="_blank">➕ ${isEnglish ? "Add to Google Calendar" : "Voeg toe aan Google Calendar"}</a></p>`;

    const recipients: string[] = [];
    if (await wantsReminders(supabase, email_a)) recipients.push(email_a);
    if (await wantsReminders(supabase, email_b)) recipients.push(email_b);

    if (recipients.length > 0) {
      const emailRes = await retry(() => fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "noreply@anemimeets.com",
          to: recipients,
          subject,
          html,
          attachments: [{
            filename: "meeting.ics",
            content: icsBase64,
            type: "text/calendar"
          }]
        })
      }));

      if (!emailRes.ok) throw new Error("Email not sent: " + (await emailRes.text()));
    }

    log('Meeting confirmation sent', { token });

    return new Response(JSON.stringify({
      success: true,
      cafe_name: cafe.name,
      cafe_address: cafe.address,
      invitation_token: token,
      selected_date,
      selected_time,
      ics_base64: icsBase64
    }), {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" }
    });

  } catch (e) {
    logError(e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
});
