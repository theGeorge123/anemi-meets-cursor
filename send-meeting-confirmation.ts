import "jsr:@supabase/functions-js/edge-runtime.d.ts";
Deno.serve(async (req)=>{
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
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("Missing Resend API key");
    const { token } = await req.json();
    if (!token) throw new Error("Missing token");
    // 1. Supabase client
    // @ts-ignore
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    // 2. Haal invitation op (met alle info)
    const { data: invitation } = await supabase
      .from("invitations")
      .select("*, cafe: cafes(*), creator: profiles(email)")
      .eq("token", token)
      .single();
    if (!invitation) throw new Error("Invitation not found");
    // 3. Haal cafe info
    let cafeName = "";
    let cafeAddress = "";
    if (invitation.cafe) {
      cafeName = invitation.cafe.name || "";
      cafeAddress = invitation.cafe.address || "";
    }
    // 4. Haal e-mail van creator (persoon A)
    let emailA = invitation.email; // invitee
    let emailB = invitation.creator?.email || null; // creator
    // 5. ICS-bestand genereren
    const date = invitation.selected_date; // 'YYYY-MM-DD'
    const time = invitation.selected_time; // 'morning', 'afternoon', 'evening'
    let dtStart = "";
    let dtEnd = "";
    if (date && time) {
      if (time === "morning") {
        dtStart = `${date.replace(/-/g, "")}T090000Z`;
        dtEnd = `${date.replace(/-/g, "")}T110000Z`;
      } else if (time === "afternoon") {
        dtStart = `${date.replace(/-/g, "")}T140000Z`;
        dtEnd = `${date.replace(/-/g, "")}T160000Z`;
      } else if (time === "evening") {
        dtStart = `${date.replace(/-/g, "")}T190000Z`;
        dtEnd = `${date.replace(/-/g, "")}T210000Z`;
      }
    }
    const ics = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY=Koffie Meetup
DTSTART:${dtStart}
DTEND:${dtEnd}
DESCRIPTION=Jullie koffie-afspraak!
LOCATION:${cafeName} ${cafeAddress}
END:VEVENT
END:VCALENDAR
    `.trim();
    // 6. Stuur e-mail naar beide deelnemers
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "noreply@anemimeets.com",
        to: [
          emailA,
          emailB
        ].filter(Boolean),
        subject: "Jullie koffie-afspraak is bevestigd!",
        html: `<p>Jullie koffie-afspraak is bevestigd!<br>Zie de bijlage voor een kalenderuitnodiging.<br><br><b>Locatie:</b> ${cafeName} ${cafeAddress}<br><b>Datum:</b> ${date}<br><b>Tijd:</b> ${time}</p>`,
        attachments: [
          {
            filename: "meetup.ics",
            content: btoa(ics),
            type: "text/calendar"
          }
        ]
      })
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response("Internal error", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}); 