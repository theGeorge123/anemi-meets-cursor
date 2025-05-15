import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔐 Veilige UTF-8 base64 encoding
function encodeBase64(str: string) {
  return btoa(unescape(encodeURIComponent(str)));
}

Deno.serve(async (req) => {
  // 🌍 CORS preflight
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

    // ✅ Update uitnodiging
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

    const { email_a, cafe_name, cafe_address } = invitation;
    if (!email_a || !email_b) throw new Error("Missing one or both emails.");

    // 📅 ICS-bestand maken
    const datePart = selected_date.replace(/-/g, "");
    const [dtStart, dtEnd] = {
      morning: ["T090000Z", "T110000Z"],
      afternoon: ["T140000Z", "T160000Z"],
      evening: ["T190000Z", "T210000Z"]
    }[selected_time] || ["T090000Z", "T110000Z"];

    const ics = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY=Koffie Meetup
DTSTART:${datePart}${dtStart}
DTEND:${datePart}${dtEnd}
DESCRIPTION=Jullie koffie-afspraak!
LOCATION:${cafe_name || ""} ${cafe_address || ""}
END:VEVENT
END:VCALENDAR`.trim();

    const html = `
<p>Jullie koffie-afspraak is bevestigd! 🎉<br><br>
<b>Locatie:</b> ${cafe_name || "Onbekend"}<br>
<b>Datum:</b> ${selected_date}<br>
<b>Tijd:</b> ${selected_time}<br><br>
Bekijk de bijlage om het toe te voegen aan je agenda.</p>`;

    // 📧 Versturen via Resend (met timeout)
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
