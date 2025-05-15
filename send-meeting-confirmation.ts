/// <reference types="deno" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      throw new Error("Missing environment variables");
    }

    const { token } = await req.json();
    if (!token) throw new Error("Missing token");

    // 1. Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Fetch invitation by token
    const { data: invitation, error } = await supabase
      .from("invitations")
      .select("token, email_a, email_b, selected_date, selected_time, cafe_name, cafe_address")
      .eq("token", token)
      .single();
    if (error || !invitation) throw new Error("Invitation not found");

    const { email_a, email_b, selected_date, selected_time, cafe_name, cafe_address } = invitation;
    if (!email_a || !email_b) throw new Error("Both email_a and email_b must be present");

    // 3. Generate ICS file
    let dtStart = "";
    let dtEnd = "";
    if (selected_date && selected_time) {
      if (selected_time === "morning") {
        dtStart = `${selected_date.replace(/-/g, "")}T090000Z`;
        dtEnd = `${selected_date.replace(/-/g, "")}T110000Z`;
      } else if (selected_time === "afternoon") {
        dtStart = `${selected_date.replace(/-/g, "")}T140000Z`;
        dtEnd = `${selected_date.replace(/-/g, "")}T160000Z`;
      } else if (selected_time === "evening") {
        dtStart = `${selected_date.replace(/-/g, "")}T190000Z`;
        dtEnd = `${selected_date.replace(/-/g, "")}T210000Z`;
      }
    }
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY=Koffie Meetup\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nDESCRIPTION=Jullie koffie-afspraak!\nLOCATION:${cafe_name} ${cafe_address}\nEND:VEVENT\nEND:VCALENDAR`;
    const icsBase64 = btoa(ics);

    // Voeg veilige base64 encoder toe
    function encodeBase64(str: string) {
      return btoa(unescape(encodeURIComponent(str)));
    }

    // 4. Send email to both participants
    const html = `<p>Jullie koffie-afspraak is bevestigd!<br><b>Locatie:</b> ${cafe_name} ${cafe_address}<br><b>Datum:</b> ${selected_date}<br><b>Tijd:</b> ${selected_time}</p><p>Zie de bijlage voor een kalenderuitnodiging.</p>`;
    const fromEmail = "noreply@yourdomain.com"; // TODO: Replace with your verified sender
    const to = [email_a, email_b];

    // Timeout-veiligheid
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 sec timeout

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject: "Jullie koffie-afspraak is bevestigd!",
        html,
        attachments: [
          {
            filename: "meetup.ics",
            content: encodeBase64(ics),
            type: "text/calendar"
          }
        ]
      }),
      signal: controller.signal
    }).catch((err) => {
      throw new Error("Resend timeout or error: " + err.message);
    });

    clearTimeout(timeout);

    if (!res?.ok) {
      const error = await res.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
}); 