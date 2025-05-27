import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function encodeBase64(str: string) {
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

    const reqBody = await req.json();
    const lang = reqBody.lang || "nl";
    const isEnglish = lang === "en";
    const { token, email_b, selected_date, selected_time } = reqBody;
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

    if (error || !invitation) throw new Error(error?.message || "Could not update invitation.");

    const { email_a, cafe_id } = invitation;
    if (!email_a || !cafe_id) throw new Error("Missing email or cafe_id");

    const { data: cafe, error: cafeError } = await supabase
      .from("cafes")
      .select("name, address, image_url")
      .eq("id", cafe_id)
      .single();

    if (cafeError || !cafe) throw new Error("Café niet gevonden.");

    const slots = {
      morning: ["T090000", "T120000"],
      afternoon: ["T120000", "T170000"],
      evening: ["T170000", "T210000"]
    };
    const readableTimes = isEnglish
      ? {
          morning: "09:00 – 12:00",
          afternoon: "12:00 – 17:00",
          evening: "17:00 – 21:00"
        }
      : {
          morning: "09:00 – 12:00",
          afternoon: "12:00 – 17:00",
          evening: "17:00 – 21:00"
        };
    const safeTime = selected_time.toLowerCase();
    if (!slots[safeTime]) console.warn("Unexpected time slot:", safeTime);
    const [dtStart, dtEnd] = slots[safeTime] || ["T090000", "T120000"];
    const readableTime = readableTimes[safeTime] || (isEnglish ? "Unknown" : "Onbekend");

    const datePart = selected_date.replace(/-/g, "");
    const uid = crypto.randomUUID();
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsSummary = isEnglish
      ? `Coffee Meetup with ${email_a.split('@')[0]}`
      : `Koffie Meetup met ${email_a.split('@')[0]}`;
    const icsDescription = isEnglish
      ? `Your coffee meetup is confirmed via Anemi Meets!`
      : `Jullie koffie-afspraak via Anemi Meets!`;

    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Koffie Meetup\nDTSTART:${datePart}${dtStart}00Z\nDTEND:${datePart}${dtEnd}00Z\nDESCRIPTION:Jullie koffie-afspraak!\nLOCATION:${cafe.name} ${cafe.address}\nEND:VEVENT\nEND:VCALENDAR`;

    const title = encodeURIComponent(isEnglish ? "Coffee Meetup via Anemi" : "Koffie Meetup via Anemi");
    const description = encodeURIComponent(isEnglish ? "Your meetup is confirmed!" : "Jullie afspraak is bevestigd!");
    const location = encodeURIComponent(`${cafe.name} ${cafe.address}`);
    const start = `${datePart}${dtStart}00Z`;
    const end = `${datePart}${dtEnd}00Z`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cafe.name} ${cafe.address}`)}`;
    const gcalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${description}&location=${location}`;
    const cafeImageUrl = cafe.image_url || `https://source.unsplash.com/600x300/?coffee,${encodeURIComponent(cafe.name)}`;

    const nameA = email_a.split('@')[0];
    const subject = isEnglish
      ? `☕️ ${nameA} just booked coffee with you!`
      : `☕️ ${nameA} heeft een koffie-date gepland!`;
    const html = isEnglish
      ? `
<h2>☕️ Yes! Your coffee meetup is set!</h2>
<img src="${cafeImageUrl}" alt="Café image" width="100%" style="max-width:600px;border-radius:12px;margin-bottom:16px;" />
<p>Hey legends!<br>
You just planned a coffee meetup at <b>${cafe.name}</b>.<br>
<b>Address:</b> ${cafe.address}<br>
<b>Date:</b> ${selected_date}<br>
<b>Time:</b> ${readableTime}</p>
<p>Add it to your calendar below, and remember: first round is for the fastest 😉</p>
<p>🗓️ <a href="${gcalUrl}" target="_blank">➕ Add to Google Calendar</a><br>
📎 Or use the attachment below for Apple or Outlook (.ics)</p>
<p style="margin-top:24px;">See you soon!<br><span style="font-size:1.2em;">– The Anemi Meets Team</span></p>
`
      : `
<h2>☕️ Yes! Jullie koffie-date staat!</h2>
<img src="${cafeImageUrl}" alt="Café foto" width="100%" style="max-width:600px;border-radius:12px;margin-bottom:16px;" />
<p>Hey toppers!<br>
Jullie hebben zojuist samen een koffie-afspraak gepland bij <b>${cafe.name}</b>.<br>
<b>Adres:</b> ${cafe.address}<br>
<b>Wanneer:</b> ${selected_date} om ${readableTime}</p>
<p>Voeg het meteen toe aan je agenda (zie hieronder) en vergeet niet: de eerste ronde is voor de snelste 😉</p>
<p>🗓️ <a href="${gcalUrl}" target="_blank">➕ Voeg toe aan Google Calendar</a><br>
📎 Of gebruik de bijlage hieronder voor Apple of Outlook (.ics)</p>
<p style="margin-top:24px;">Tot snel!<br><span style="font-size:1.2em;">– Het Anemi Meets team</span></p>
`;

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
        subject,
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

    return new Response(JSON.stringify({ 
      success: true,
      cafe_name: cafe.name,
      cafe_address: cafe.address,
      invitation_token: token,
      selected_date,
      selected_time
    }), {
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
