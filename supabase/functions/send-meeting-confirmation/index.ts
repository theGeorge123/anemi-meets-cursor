import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function encodeBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      throw new Error("Missing environment variables.");
    }

    const { token, email_b, selected_date, selected_time } = await req.json();

    if (!token || !email_b || !selected_date || !selected_time) {
      throw new Error("Missing required fields.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: invitation, error } = await supabase
      .from("invitations")
      .update({
        email_b,
        selected_date,
        selected_time,
        status: "accepted"
      })
      .eq("token", token)
      .neq("status", "accepted")
      .select()
      .single();

    if (error || !invitation) {
      throw new Error(error?.message || "Could not update invitation.");
    }

    const { email_a, cafe_id } = invitation;
    if (!email_a || !email_b) throw new Error("Missing one or both emails.");
    if (!cafe_id) throw new Error("Missing cafe_id in invitation.");

    const { data: cafe, error: cafeError } = await supabase
      .from("cafes")
      .select("name, address, image_url")
      .eq("id", cafe_id)
      .single();

    if (cafeError || !cafe) throw new Error("Café niet gevonden");

    const slots = {
      morning: ["T090000Z", "T120000Z"],
      afternoon: ["T120000Z", "T180000Z"],
      evening: ["T180000Z", "T220000Z"]
    };
    const readableTimes = {
      morning: "09:00 – 12:00",
      afternoon: "12:00 – 18:00",
      evening: "18:00 – 22:00"
    };
    const safeTime = selected_time.toLowerCase();
    const [dtStart, dtEnd] = slots[safeTime] || ["T090000Z", "T120000Z"];
    const readableTime = readableTimes[safeTime] || "Onbekend";

    const datePart = selected_date.replace(/-/g, "");
    const uid = crypto.randomUUID();
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const ics = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AnemiMeets//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:${uid}
SUMMARY=Koffie Meetup met ${email_a.split('@')[0]}
DTSTAMP:${dtStamp}
DTSTART:${datePart}${dtStart}
DTEND:${datePart}${dtEnd}
LOCATION:${cafe.name} ${cafe.address}
DESCRIPTION=Jullie koffie-afspraak via Anemi Meets
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`.trim();

    const title = encodeURIComponent("Koffie Meetup via Anemi");
    const description = encodeURIComponent("Jullie afspraak is bevestigd!");
    const location = encodeURIComponent(`${cafe.name} ${cafe.address}`);
    const start = `${datePart}${dtStart}`;
    const end = `${datePart}${dtEnd}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cafe.name} ${cafe.address}`)}`;
    const gcalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}&location=${location}`;
    const cafeImageUrl = cafe.image_url || `https://source.unsplash.com/600x300/?coffee,${encodeURIComponent(cafe.name)}`;

    const html = `
<h2>🎉 Jullie koffie-afspraak is bevestigd!</h2>
<img src="${cafeImageUrl}" alt="Café foto" width="100%" style="max-width:600px;border-radius:12px;margin-bottom:16px;" />
<p><b>📍 Locatie:</b> <a href="${mapsUrl}" target="_blank" style="color:#007AFF">${cafe.name}</a><br>
<b>🗺️ Adres:</b> ${cafe.address}<br>
<b>📅 Datum:</b> ${selected_date}<br>
<b>⏰ Tijd:</b> ${readableTime}</p>
<p>🗓️ <a href="${gcalUrl}" target="_blank">➕ Voeg toe aan Google Calendar</a><br>
📎 Of gebruik de bijlage hieronder voor Apple of Outlook (.ics)</p>
<p style="margin-top:24px;">Tot snel!<br>– Het Anemi Meets team</p>`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "noreply@anemimeets.com",
        to: [email_a, email_b],
        subject: "Jullie koffie-afspraak is bevestigd!",
        html,
        attachments: [
          {
            filename: "meeting.ics",
            content: encodeBase64(ics),
            type: "text/calendar"
          }
        ]
      }),
      signal: controller.signal
    }).catch(err => {
      throw new Error("Resend timeout or error: " + err.message);
    });

    clearTimeout(timeout);

    if (!emailRes.ok) {
      const text = await emailRes.text();
      throw new Error("Resend error: " + text);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    console.error("Function error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
